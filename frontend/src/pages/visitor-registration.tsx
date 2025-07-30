import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { ArrowRight, ArrowLeft, Camera, CheckCircle, User, Mail, CreditCard, Settings, Calendar, UserPlus, UserCheck } from "lucide-react";
import PhotoCaptureModal from "@/components/photo-capture-modal";
import QrDisplayModal from "@/components/qr-display-modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Step schemas for wizard form
const returningVisitorSchema = z.object({
  isReturning: z.enum(['yes', 'no']),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
});

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

const completeSchema = basicDetailsSchema.merge(contactDetailsSchema).merge(idDetailsSchema).extend({
  id: z.number().optional(), // Add ID field for returning visitors
});

type CompleteFormData = z.infer<typeof completeSchema>;
type BasicDetailsData = z.infer<typeof basicDetailsSchema>;
type ContactDetailsData = z.infer<typeof contactDetailsSchema>;
type IdDetailsData = z.infer<typeof idDetailsSchema>;

const combinedSchema = basicDetailsSchema.merge(contactDetailsSchema);
type CombinedData = z.infer<typeof combinedSchema>;

export default function VisitorRegistration() {
  const [step, setStep] = useState(0); // 0: Returning Visitor Check, 1: Basic+Contact, 2: ID, 3: Selfie, 4: ID Photo, 5: Review & Submit, 6: Complete
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

  // Form for returning visitor check
  const returningVisitorForm = useForm<z.infer<typeof returningVisitorSchema>>({
    resolver: zodResolver(returningVisitorSchema),
    defaultValues: {
      isReturning: 'no',
    },
  });

  // Mutation for finding existing visitor
  const findVisitorMutation = useMutation({
    mutationFn: async (data: { email?: string; phone?: string }) => {
      const response = await api.post('/visitor/find-by-email-or-phone', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Pre-fill the form with existing visitor data
      setFormData({
        id: data.id, // Make sure to include the ID
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        idType: data.idType,
        idNumber: data.idNumber,
        hostName: data.hostName,
        hostEmail: data.hostEmail,
        hostPhone: data.hostPhone,
        purpose: 'Return Visit', // Add a default purpose for returning visitors
      });
      setSelfiePhoto(data.photoUrl);
      setIdPhoto(data.idPhotoUrl);
      setStep(5); // Skip to review step for returning visitors
      toast({
        title: 'Visitor Found',
        description: 'Welcome back! Please review your information.',
      });
    },
    onError: (error: any) => {
      if (error.response?.status === 404) {
        toast({
          title: 'Visitor Not Found',
          description: 'Please proceed with new visitor registration.',
        });
        setStep(1); // Proceed to new visitor registration
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to find visitor',
          variant: 'destructive',
        });
      }
    },
  });

  // Handle returning visitor form submission
  const onSubmitReturningVisitor = (data: z.infer<typeof returningVisitorSchema>) => {
    if (data.isReturning === 'yes' && (data.email || data.phone)) {
      findVisitorMutation.mutate({
        email: data.email,
        phone: data.phone,
      });
    } else {
      setStep(1); // Proceed to new visitor registration
    }
  };

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

  // Mutation for creating a visit for returning visitor
  const createVisitMutation = useMutation({
    mutationFn: async (data: { visitorId: number; visit_date: string; notes?: string }) => {
      const response = await api.post(`/visitor/${data.visitorId}/create-visit`, {
        visit_date: data.visit_date,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setRegistrationResult(data);
      setStep(6);
      toast({
        title: 'Visit Scheduled',
        description: 'Your visit has been scheduled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Schedule Visit',
        description: error.response?.data?.message || 'Failed to schedule visit',
        variant: 'destructive',
      });
    },
  });

  // Navigation handlers
  const handleStaffLogin = () => {
    setLocation("/staff-login");
  };

  const handleBack = () => {
    if (step > 0) {
      if (formData.id) {
        // For returning visitors, skip photo steps when going back
        switch (step) {
          case 5: // From Review to ID Details
            setStep(2);
            break;
          case 2: // From ID Details to Basic Details
            setStep(1);
            break;
          case 1: // From Basic Details to Initial Check
            setStep(0);
            break;
          default:
            setStep(step - 1);
        }
      } else {
        setStep(step - 1);
      }
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
    // Skip to review if returning visitor, otherwise go to ID details
    setStep(formData.id ? 5 : 2);
  };

  const onSubmitId = (data: IdDetailsData) => {
    setFormData(prev => ({ ...prev, ...data }));
    // Skip to review if returning visitor, otherwise go to selfie
    setStep(formData.id ? 5 : 3);
  };

  const handlePhotoCapture = (photoData: string) => {
    if (photoType === 'selfie') {
      setSelfiePhoto(photoData);
      setIsPhotoModalOpen(false);
      setStep(4);
    } else {
      setIdPhoto(photoData);
      setIsPhotoModalOpen(false);
      setStep(5);
    }
  };

  const openPhotoCapture = (type: 'selfie' | 'id') => {
    setPhotoType(type);
    setIsPhotoModalOpen(true);
  };

  // Update submitRegistration function to handle both new and returning visitors
  const submitRegistration = async () => {
    if (!formData) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields',
        variant: 'destructive',
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (formData.id) {
      // For returning visitors, create a new visit
      createVisitMutation.mutate({
        visitorId: formData.id,
        visit_date: today,
        notes: `Return visit - ${formData.purpose}`,
      });
    } else {
      // Create a new registration
      registrationMutation.mutate({
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
        pic: selfiePhoto || '', // Make photos optional
        id_pic: idPhoto || '', // Make photos optional
        visit_date: today,
      });
    }
  };

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return <UserCheck className="w-6 h-6" />;
      case 1:
        return <User className="w-6 h-6" />;
      case 2:
        return <CreditCard className="w-6 h-6" />;
      case 3:
        return <Camera className="w-6 h-6" />;
      case 4:
        return <Camera className="w-6 h-6" />;
      case 5:
        return <CheckCircle className="w-6 h-6" />;
      case 6:
        return <CheckCircle className="w-6 h-6" />;
      default:
        return <User className="w-6 h-6" />;
    }
  };

  const getStepTitle = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return "Returning Visitor";
      case 1:
        return "Your Details";
      case 2:
        return "ID Details";
      case 3:
        return "Take Selfie";
      case 4:
        return "ID Photo";
      case 5:
        return "Review & Submit";
      case 6:
        return "Complete";
      default:
        return "Step";
    }
  };

  const progressValue = (step / 6) * 100;

  // Render returning visitor form
  // if (step === 0) {
  //   return (
  //     <Card className="w-full max-w-2xl mx-auto">
  //       <CardHeader>
  //         <CardTitle className="text-2xl font-bold text-center">Welcome to Visitor Registration</CardTitle>
  //       </CardHeader>
  //       <CardContent>
  //         <Form {...returningVisitorForm}>
  //           <form onSubmit={returningVisitorForm.handleSubmit(onSubmitReturningVisitor)} className="space-y-6">
  //             <FormField
  //               control={returningVisitorForm.control}
  //               name="isReturning"
  //               render={({ field }) => (
  //                 <FormItem className="space-y-3">
  //                   <FormLabel>Have you visited before?</FormLabel>
  //                   <FormControl>
  //                     <RadioGroup
  //                       onValueChange={field.onChange}
  //                       defaultValue={field.value}
  //                       className="flex flex-col space-y-1"
  //                     >
  //                       <div className="flex items-center space-x-2">
  //                         <RadioGroupItem value="yes" id="yes" />
  //                         <Label htmlFor="yes">Yes, I have visited before</Label>
  //                       </div>
  //                       <div className="flex items-center space-x-2">
  //                         <RadioGroupItem value="no" id="no" />
  //                         <Label htmlFor="no">No, I am a new visitor</Label>
  //                       </div>
  //                     </RadioGroup>
  //                   </FormControl>
  //                   <FormMessage />
  //                 </FormItem>
  //               )}
  //             />

  //             {returningVisitorForm.watch("isReturning") === "yes" && (
  //               <div className="space-y-4">
  //                 <FormField
  //                   control={returningVisitorForm.control}
  //                   name="email"
  //                   render={({ field }) => (
  //                     <FormItem>
  //                       <FormLabel>Email</FormLabel>
  //                       <FormControl>
  //                         <Input placeholder="Enter your email" {...field} />
  //                       </FormControl>
  //                       <FormMessage />
  //                     </FormItem>
  //                   )}
  //                 />

  //                 <div className="text-center text-sm text-gray-500">- OR -</div>

  //                 <FormField
  //                   control={returningVisitorForm.control}
  //                   name="phone"
  //                   render={({ field }) => (
  //                     <FormItem>
  //                       <FormLabel>Phone Number</FormLabel>
  //                       <FormControl>
  //                         <Input placeholder="Enter your phone number" {...field} />
  //                       </FormControl>
  //                       <FormMessage />
  //                     </FormItem>
  //                   )}
  //                 />
  //               </div>
  //             )}

  //             <div className="flex justify-end space-x-2">
  //               <Button type="submit" disabled={findVisitorMutation.isPending}>
  //                 {findVisitorMutation.isPending ? "Checking..." : "Continue"}
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             </div>
  //           </form>
  //         </Form>
  //       </CardContent>
  //     </Card>
  //   );
  // }

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
            <p className="text-xs text-gray-600">
              Step {step} of {formData.id ? 4 : 6}
            </p>
          </div>

          {/* Desktop: Full stepper */}
          <div className="hidden sm:flex items-center justify-center mb-4">
            <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto pb-2">
              {[0, 1, 2, ...(formData.id ? [] : [3, 4]), 5, 6].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                    step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {getStepIcon(stepNumber)}
                  </div>
                  {stepNumber < (formData.id ? 4 : 6) && (
                    <div className="w-4 sm:w-8 h-0.5 bg-gray-300 mx-1 sm:mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mb-4 hidden sm:block">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">{getStepTitle(step)}</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Step {step} of {formData.id ? 4 : 6}
            </p>
          </div>

          <Progress value={(step / (formData.id ? 4 : 6)) * 100} className="w-full" />
        </div>

        {/* Step 0: Returning Visitor */}
        {step === 0 && (
          <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Welcome to Visitor Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...returningVisitorForm}>
              <form onSubmit={returningVisitorForm.handleSubmit(onSubmitReturningVisitor)} className="space-y-6">
                <FormField
                  control={returningVisitorForm.control}
                  name="isReturning"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Have you visited before?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="yes" />
                            <Label htmlFor="yes">Yes, I have visited before</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="no" />
                            <Label htmlFor="no">No, I am a new visitor</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                {returningVisitorForm.watch("isReturning") === "yes" && (
                  <div className="space-y-4">
                    <FormField
                      control={returningVisitorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
  
                    <div className="text-center text-sm text-gray-500">- OR -</div>
  
                    <FormField
                      control={returningVisitorForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
  
                <div className="flex justify-end space-x-2">
                  <Button type="submit" disabled={findVisitorMutation.isPending}>
                    {findVisitorMutation.isPending ? "Checking..." : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          </Card>
        )}

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

        {/* Step 3: Selfie */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-5 w-5" />
                Take Your Selfie
              </CardTitle>
              <p className="text-gray-600">Please take a photo of yourself for identification.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                {selfiePhoto ? (
                  <div className="relative">
                    <img src={selfiePhoto} alt="Selfie preview" className="max-w-xs rounded-lg" />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => openPhotoCapture('selfie')}
                    >
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => openPhotoCapture('selfie')}>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setStep(4)}>
                    Skip
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!selfiePhoto && !formData.id}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
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
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                {idPhoto ? (
                  <div className="relative">
                    <img src={idPhoto} alt="ID preview" className="max-w-xs rounded-lg" />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => openPhotoCapture('id')}
                    >
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => openPhotoCapture('id')}>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setStep(5)}>
                    Skip
                  </Button>
                  <Button
                    onClick={() => setStep(5)}
                    disabled={!idPhoto && !formData.id}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
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
                {/* <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs">QR Code</span>
                    </div>
                    <p className="text-sm font-medium">
                      Badge #{registrationResult?.badgeNumber || 'VIS' + Date.now()}
                    </p>
                  </div>
                </div> */}

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
                  {/* <Button
                    className="w-full"
                    onClick={() => setIsQrModalOpen(true)}
                    disabled={!registrationResult}
                  >
                    View QR Code (Coming Soon)
                  </Button> */}
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