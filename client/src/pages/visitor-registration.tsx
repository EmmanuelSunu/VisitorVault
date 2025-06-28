import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Camera, CheckCircle, User, Mail, CreditCard, Settings } from "lucide-react";
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

export default function VisitorRegistration() {
  const [step, setStep] = useState(1); // 1: Basic, 2: Contact, 3: ID, 4: Selfie, 5: ID Photo, 6: Complete
  const [formData, setFormData] = useState<Partial<CompleteFormData>>({});
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoType, setPhotoType] = useState<'selfie' | 'id'>('selfie');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Navigation handlers
  const handleStaffLogin = () => {
    setLocation("/staff");
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
  const basicForm = useForm<BasicDetailsData>({
    resolver: zodResolver(basicDetailsSchema),
    defaultValues: {
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      purpose: formData.purpose || "",
    },
  });

  const contactForm = useForm<ContactDetailsData>({
    resolver: zodResolver(contactDetailsSchema),
    defaultValues: {
      email: formData.email || "",
      phone: formData.phone || "",
      company: formData.company || "",
    },
  });

  const idForm = useForm<IdDetailsData>({
    resolver: zodResolver(idDetailsSchema),
    defaultValues: {
      idType: formData.idType || "",
      idNumber: formData.idNumber || "",
    },
  });

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async (data: { visitor: any; visitRequest: any }) => {
      const response = await apiRequest("POST", "/api/visitors/register", data);
      return response.json();
    },
    onSuccess: (result) => {
      setRegistrationResult(result);
      setStep(6);
      toast({
        title: "Registration Successful",
        description: "Your visitor registration has been submitted for approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Step handlers
  const onSubmitBasic = (data: BasicDetailsData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const onSubmitContact = (data: ContactDetailsData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(3);
  };

  const onSubmitId = (data: IdDetailsData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(4);
  };

  const handlePhotoCapture = (photoData: string) => {
    if (photoType === 'selfie') {
      setSelfiePhoto(photoData);
      setStep(5);
    } else {
      setIdPhoto(photoData);
      setStep(6);
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

    const visitorData = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      company: formData.company || "",
      photoData: selfiePhoto,
      badgeNumber: `VIS${Date.now()}`,
    };

    const visitRequestData = {
      purpose: formData.purpose,
      visitDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().split(' ')[0],
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toTimeString().split(' ')[0], // 4 hours later
      hostId: "14309216", // Default host - in a real app, this would be configurable
      locationId: 1, // Default location - in a real app, this would be configurable
      status: "pending",
      notes: `ID Type: ${formData.idType}, ID Number: ${formData.idNumber}`,
    };

    registrationMutation.mutate({
      visitor: visitorData,
      visitRequest: visitRequestData,
    });
  };

  const getStepIcon = (stepNumber: number) => {
    const icons = [User, Mail, CreditCard, Camera, Camera, CheckCircle];
    const Icon = icons[stepNumber - 1] || User;
    return <Icon className="h-5 w-5" />;
  };

  const getStepTitle = (stepNumber: number) => {
    const titles = ["Basic Details", "Contact Info", "ID Details", "Take Selfie", "ID Photo", "Complete"];
    return titles[stepNumber - 1] || "Step";
  };

  const progressValue = (step / 6) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visitor Registration</h1>
              <p className="text-gray-600">Welcome! Please complete your registration below.</p>
            </div>
            <Button variant="ghost" onClick={handleStaffLogin} className="text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Staff Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {getStepIcon(stepNumber)}
                  </div>
                  {stepNumber < 6 && <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{getStepTitle(step)}</h2>
            <p className="text-sm text-gray-600">Step {step} of 6</p>
          </div>
          <Progress value={progressValue} className="w-full" />
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
              <p className="text-gray-600">Let's start with your basic details.</p>
            </CardHeader>
            <CardContent>
              <Form {...basicForm}>
                <form onSubmit={basicForm.handleSubmit(onSubmitBasic)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={basicForm.control}
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
                    <FormField
                      control={basicForm.control}
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

                  <FormField
                    control={basicForm.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Visit</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe the purpose of your visit..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Contact Information
              </CardTitle>
              <p className="text-gray-600">How can we reach you?</p>
            </CardHeader>
            <CardContent>
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-6">
                  <FormField
                    control={contactForm.control}
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
                    control={contactForm.control}
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
                    control={contactForm.control}
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

        {/* Step 3: ID Details */}
        {step === 3 && (
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

        {/* Step 4: Selfie Photo */}
        {step === 4 && (
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
                    <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={selfiePhoto}
                        alt="Your selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button variant="outline" onClick={() => openPhotoCapture('selfie')}>
                      <Camera className="mr-2 h-4 w-4" />
                      Retake Selfie
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                      <Camera className="h-16 w-16 text-gray-400" />
                    </div>
                    <Button onClick={() => openPhotoCapture('selfie')}>
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

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(5)}
                    disabled={!selfiePhoto}
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: ID Photo */}
        {step === 5 && (
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
                    <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={idPhoto}
                        alt="Your ID"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button variant="outline" onClick={() => openPhotoCapture('id')}>
                      <Camera className="mr-2 h-4 w-4" />
                      Retake ID Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                      <CreditCard className="h-16 w-16 text-gray-400" />
                    </div>
                    <Button onClick={() => openPhotoCapture('id')}>
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

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={submitRegistration}
                    disabled={!idPhoto || registrationMutation.isPending}
                  >
                    {registrationMutation.isPending ? "Submitting..." : "Complete Registration"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Completion */}
        {step === 6 && registrationResult && (
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
                    <p className="text-sm font-medium">Badge #{registrationResult.badgeNumber}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {formData.firstName} {formData.lastName}
                  </h3>
                  <p className="text-gray-600">Badge Number: {registrationResult.badgeNumber}</p>
                  <p className="text-sm text-gray-500">
                    Please present this QR code at reception for check-in
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Status:</strong> Pending host approval. You will receive an email notification once approved.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => setIsQrModalOpen(true)}
                  >
                    View QR Code
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

      {registrationResult && (
        <QrDisplayModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          qrCodeData={registrationResult.qrCodeData}
          badgeNumber={registrationResult.badgeNumber}
          visitorName={`${formData.firstName} ${formData.lastName}`}
        />
      )}
    </div>
  );
}