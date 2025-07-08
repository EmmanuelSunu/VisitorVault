import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Camera, CheckCircle, User, Mail, CreditCard, Settings, Calendar } from "lucide-react";
import PhotoCaptureModal from "@/components/photo-capture-modal";
import QrDisplayModal from "@/components/qr-display-modal";

// Step schemas for wizard form
const basicDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  purpose: z.string().min(1, "Purpose of visit is required"),
});

const contactDetailsSchema = z.object({
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  company: z.string().optional(),
  hostName: z.string().min(1, "Host/Reception name is required"),
  hostEmail: z.string().email("Valid host email is required"),
  hostPhone: z.string().min(1, "Host phone number is required"),
});

const idDetailsSchema = z.object({
  idType: z.string().min(1, "ID type is required"),
  idNumber: z.string().min(1, "ID number is required"),
});

const completeSchema = basicDetailsSchema.merge(contactDetailsSchema).merge(idDetailsSchema);

type CompleteFormData = z.infer<typeof completeSchema>;
type BasicDetailsData = z.infer<typeof basicDetailsSchema>;
type ContactDetailsData = z.infer<typeof contactDetailsSchema>;
type IdDetailsData = z.infer<typeof idDetailsSchema>;

const combinedSchema = basicDetailsSchema.merge(contactDetailsSchema);
type CombinedData = z.infer<typeof combinedSchema>;

export default function VisitorRegistration() {
  const [step, setStep] = useState(1); // 1: Basic+Contact, 2: ID, 3: Selfie, 4: ID Photo, 5: Review & Submit, 6: Complete
  const [formData, setFormData] = useState<Partial<CompleteFormData>>({});
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoType, setPhotoType] = useState<'selfie' | 'id'>('selfie');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { api } = useAuth();
  
  // Registration mutation using real API
  const registrationMutation = useMutation({
    mutationFn: async (data: {
      f_name: string;
      l_name: string;
      purpose: string;
      email: string;
      phone: string;
      company?: string;
      h_name: string;
      h_email: string;
      h_phone: string;
      id_type: string;
      id_number: string;
      pic: string;
      id_pic: string;
      visit_date: string;
    }) => {
      const response = await api.post('/visitor/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      setRegistrationResult(data);
      setStep(6);
      toast({
        title: 'Registration Successful',
        description: 'Your visitor registration has been submitted for approval.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.message || 'Failed to submit registration',
        variant: 'destructive',
      });
    },
  });

  // Navigation handlers
  const handleStaffLogin = () => {
    setLocation("/staff-login");
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({});
    setSelfiePhoto(null);
    setIdPhoto(null);
    setRegistrationResult(null);
  };

  // Create forms for each step
  const combinedForm = useForm<CombinedData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      purpose: formData.purpose || "",
      email: formData.email || "",
      phone: formData.phone || "",
      company: formData.company || "",
      hostName: formData.hostName || "",
      hostEmail: formData.hostEmail || "",
      hostPhone: formData.hostPhone || "",
    },
  });

  const idForm = useForm<IdDetailsData>({
    resolver: zodResolver(idDetailsSchema),
    defaultValues: {
      idType: formData.idType || "",
      idNumber: formData.idNumber || "",
    },
  });

  // Step handlers
  const onSubmitCombined = (data: CombinedData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const onSubmitId = (data: IdDetailsData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(3);
  };

  const handlePhotoCapture = (photoData: string) => {
    if (photoType === 'selfie') {
      setSelfiePhoto(photoData);
      setStep(4);
    } else {
      setIdPhoto(photoData);
      setStep(5);
    }
    setIsPhotoModalOpen(false);
  };

  const openPhotoCapture = (type: 'selfie' | 'id') => {
    setPhotoType(type);
    setIsPhotoModalOpen(true);
  };

  const submitRegistration = async () => {
    if (!selfiePhoto || !idPhoto) {
      toast({
        title: "Photos Required",
        description: "Please capture both your selfie and ID photo to continue.",
        variant: "destructive",
      });
      return;
    }

    const registrationData = {
      f_name: formData.firstName!,
      l_name: formData.lastName!,
      purpose: formData.purpose!,
      email: formData.email!,
      phone: formData.phone!,
      company: formData.company,
      h_name: formData.hostName!,
      h_email: formData.hostEmail!,
      h_phone: formData.hostPhone!,
      id_type: formData.idType!,
      id_number: formData.idNumber!,
      pic: selfiePhoto,
      id_pic: idPhoto,
      visit_date: new Date().toISOString().split('T')[0],
    };

    registrationMutation.mutate(registrationData);
  };

  const getStepIcon = (stepNumber: number) => {
    const icons = [User, CreditCard, Camera, Camera, CheckCircle, CheckCircle];
    const Icon = icons[stepNumber - 1] || User;
    return <Icon className="h-5 w-5" />;
  };

  const getStepTitle = (stepNumber: number) => {
    const titles = ["Your Details", "ID Details", "Take Selfie", "ID Photo", "Review & Submit", "Complete"];
    return titles[stepNumber - 1] || "Step";
  };

  const progressValue = (step / 6) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-2 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Desiderata Visitor Management System</h1>
              <p className="text-sm sm:text-base text-gray-600">Welcome! Please complete your registration below.</p>
            </div>
            <Button variant="ghost" onClick={handleStaffLogin} className="text-sm w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              Staff Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-4 sm:py-8 px-4 mb-10 ">
        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8 align-center justify-center">
          {/* Mobile: Compact stepper */}
          <div className="flex flex-col items-center justify-center mb-4 sm:hidden">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground mb-2">
              {getStepIcon(step)}
            </div>
            <h2 className="text-base font-semibold text-gray-900">{getStepTitle(step)}</h2>
            <p className="text-xs text-gray-600">Step {step} of 6</p>
          </div>
          {/* Desktop: Full stepper */}
          <div className="hidden sm:flex items-center justify-center mb-4">
            <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                    step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {getStepIcon(stepNumber)}
                  </div>
                  {stepNumber < 6 && <div className="w-4 sm:w-8 h-0.5 bg-gray-300 mx-1 sm:mx-2"></div>}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mb-4 hidden sm:block">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">{getStepTitle(step)}</h2>
            <p className="text-xs sm:text-sm text-gray-600">Step {step} of 6</p>
          </div>
          <Progress value={progressValue} className="w-full" />
        </div>

        {/* Step 1: Combined Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Your Information
              </CardTitle>
              <p className="text-gray-600">Please provide your details and who you are visiting.</p>
            </CardHeader>
            <CardContent>
              <Form {...combinedForm}>
                <form onSubmit={combinedForm.handleSubmit(onSubmitCombined)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <FormField
                      control={combinedForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Last Name */}
                    <FormField
                      control={combinedForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Purpose */}
                  <FormField
                    control={combinedForm.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Visit</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe the purpose of your visit..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Email, Phone, Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={combinedForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={combinedForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={combinedForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Host/Reception Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={combinedForm.control}
                      name="hostName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host/Reception Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Host/Reception name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={combinedForm.control}
                      name="hostEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host/Reception Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="host@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={combinedForm.control}
                      name="hostPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host/Reception Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full sm:w-auto">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: ID Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Identification
              </CardTitle>
              <p className="text-gray-600">Please provide your identification details.</p>
            </CardHeader>
            <CardContent>
              <Form {...idForm}>
                <form onSubmit={idForm.handleSubmit(onSubmitId)} className="space-y-6">
                  <FormField
                    control={idForm.control}
                    name="idType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID type..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="drivers-license">Driver's License</SelectItem>
                            <SelectItem value="national-id">National ID</SelectItem>
                            <SelectItem value="employee-id">Employee ID</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={idForm.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Selfie Photo */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-5 w-5" />
                Take Your Selfie
              </CardTitle>
              <p className="text-gray-600">We need a clear photo of you for security purposes.</p>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                {selfiePhoto ? (
                  <div className="space-y-4">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={selfiePhoto}
                        alt="Your selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button variant="outline" onClick={() => openPhotoCapture('selfie')} className="w-full sm:w-auto">
                      <Camera className="mr-2 h-4 w-4" />
                      Retake Selfie
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                      <Camera className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                    </div>
                    <Button onClick={() => openPhotoCapture('selfie')} className="w-full sm:w-auto">
                      <Camera className="mr-2 h-4 w-4" />
                      Take Selfie
                    </Button>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Photo Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Face the camera directly</li>
                    <li>• Ensure good lighting</li>
                    <li>• Remove hats and sunglasses</li>
                    <li>• Use a plain background if possible</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto order-2 sm:order-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!selfiePhoto}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: ID Photo */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-5 w-5" />
                Photograph Your ID
              </CardTitle>
              <p className="text-gray-600">Please take a clear photo of your identification document.</p>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                {idPhoto ? (
                  <div className="space-y-4">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={idPhoto}
                        alt="Your ID"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button variant="outline" onClick={() => openPhotoCapture('id')} className="w-full sm:w-auto">
                      <Camera className="mr-2 h-4 w-4" />
                      Retake ID Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                      <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                    </div>
                    <Button onClick={() => openPhotoCapture('id')} className="w-full sm:w-auto">
                      <Camera className="mr-2 h-4 w-4" />
                      Photograph ID
                    </Button>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">ID Photo Tips:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Ensure all text is clearly readable</li>
                    <li>• Place ID on a flat, well-lit surface</li>
                    <li>• Avoid shadows and glare</li>
                    <li>• Include all corners of the document</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto order-2 sm:order-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(5)}
                    disabled={!idPhoto}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Review Your Information
              </CardTitle>
              <p className="text-gray-600 text-center">Please review all your details before submitting.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{formData.company || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Details */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Visit Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Purpose of Visit</p>
                      <p className="font-medium">{formData.purpose}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Host/Reception Name</p>
                        <p className="font-medium">{formData.hostName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Host/Reception Email</p>
                        <p className="font-medium">{formData.hostEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Host/Reception Phone</p>
                        <p className="font-medium">{formData.hostPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ID Type</p>
                        <p className="font-medium">{formData.idType}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-500">ID Number</p>
                        <p className="font-medium">{formData.idNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Camera className="mr-2 h-4 w-4" />
                    Photos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">Selfie Photo</p>
                      {selfiePhoto ? (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={selfiePhoto}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No photo</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">ID Photo</p>
                      {idPhoto ? (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={idPhoto}
                            alt="ID"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto order-2 sm:order-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={submitRegistration}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Submit Registration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Completion */}
        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600 flex items-center justify-center">
                <CheckCircle className="mr-2 h-6 w-6" />
                Registration Complete!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs">QR Code</span>
                    </div>
                    <p className="text-sm font-medium">
                      Badge #{registrationResult?.badgeNumber || 'VIS' + Date.now()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {formData.firstName} {formData.lastName}
                  </h3>
                  <p className="text-gray-600">
                    Badge Number: {registrationResult?.badgeNumber || 'VIS' + Date.now()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Please present this QR code at reception for check-in
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Status:</strong> Pending reception approval. You will receive an email notification once approved.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => setIsQrModalOpen(true)}
                    disabled={!registrationResult}
                  >
                    View QR Code (Coming Soon)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleReset}
                  >
                    Register Another Visitor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modals */}
      <PhotoCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onCapture={handlePhotoCapture}
      />

      {/* Temporarily disabled due to import issue
      {registrationResult && (
        <QrDisplayModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          qrCodeData={registrationResult.qrCodeData}
          badgeNumber={registrationResult.badgeNumber}
          visitorName={`${formData.firstName} ${formData.lastName}`}
        />
      )}
      */}
    </div>
  );
}