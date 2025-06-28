import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Camera, Download, Printer, RotateCcw } from "lucide-react";
import PhotoCaptureModal from "@/components/photo-capture-modal";
import QrDisplayModal from "@/components/qr-display-modal";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  company: z.string().optional(),
  purpose: z.string().min(1, "Purpose of visit is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  visitTime: z.string().min(1, "Visit time is required"),
  duration: z.string().min(1, "Duration is required"),
  hostId: z.string().min(1, "Host selection is required"),
  locationId: z.string().min(1, "Location selection is required"),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

export default function VisitorRegistration() {
  const [step, setStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      purpose: "",
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: "",
      duration: "1 hour",
      hostId: "",
      locationId: "",
    },
  });

  // Fetch hosts
  const { data: hosts = [] } = useQuery({
    queryKey: ["/api/hosts"],
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async (data: { visitor: any; visitRequest: any }) => {
      const response = await apiRequest("POST", "/api/visitors/register", data);
      return response.json();
    },
    onSuccess: (result) => {
      setRegistrationResult(result);
      setStep(3);
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

  const onSubmitPersonalInfo = (data: PersonalInfoData) => {
    setPersonalInfo(data);
    setStep(2);
  };

  const handlePhotoCapture = (photoData: string) => {
    setPhoto(photoData);
    setIsPhotoModalOpen(false);
  };

  const submitRegistration = () => {
    if (!personalInfo) return;

    const visitDateTime = new Date(`${personalInfo.visitDate}T${personalInfo.visitTime}`);
    
    const visitorData = {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      email: personalInfo.email,
      phone: personalInfo.phone,
      company: personalInfo.company || null,
      photoUrl: photo,
    };

    const visitRequestData = {
      hostId: personalInfo.hostId,
      locationId: parseInt(personalInfo.locationId),
      purpose: personalInfo.purpose,
      visitDate: visitDateTime.toISOString(),
      duration: personalInfo.duration,
    };

    registrationMutation.mutate({
      visitor: visitorData,
      visitRequest: visitRequestData,
    });
  };

  const progressValue = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Visitor Registration</h1>
                <p className="text-sm text-gray-500">Complete your visit registration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-sm font-medium">1</span>
                </div>
                <span className={`text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Personal Info
                </span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-sm font-medium">2</span>
                </div>
                <span className={`text-sm ${step >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Photo
                </span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-sm font-medium">3</span>
                </div>
                <span className={`text-sm ${step >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Confirmation
                </span>
              </div>
            </div>
          </div>
          <Progress value={progressValue} className="w-full" />
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Our Office</CardTitle>
              <p className="text-gray-600">Please provide your information to register for your visit.</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPersonalInfo)} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Company */}
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Purpose of Visit */}
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Visit</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={3} 
                            placeholder="Business meeting, interview, delivery, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Visit Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="visitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visit Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="visitTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1 hour">1 hour</SelectItem>
                              <SelectItem value="2 hours">2 hours</SelectItem>
                              <SelectItem value="Half day">Half day</SelectItem>
                              <SelectItem value="Full day">Full day</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Host Selection */}
                  <FormField
                    control={form.control}
                    name="hostId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your host..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hosts.map((host: any) => (
                              <SelectItem key={host.id} value={host.id}>
                                {host.firstName} {host.lastName} - {host.department}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location Selection */}
                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {locations.map((location: any) => (
                            <div key={location.id} className="relative">
                              <input
                                type="radio"
                                name="location"
                                id={`location-${location.id}`}
                                value={location.id.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="sr-only"
                              />
                              <label
                                htmlFor={`location-${location.id}`}
                                className={`block cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                                  field.value === location.id.toString()
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-300 hover:border-primary'
                                }`}
                              >
                                {location.imageUrl && (
                                  <img
                                    src={location.imageUrl}
                                    alt={location.name}
                                    className="w-full h-32 object-cover rounded-md mb-3"
                                  />
                                )}
                                <h3 className="font-medium text-gray-900">{location.name}</h3>
                                <p className="text-sm text-gray-500">{location.address}</p>
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                    <Button type="submit">
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Photo Capture */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Capture Your Photo</CardTitle>
              <p className="text-gray-600">
                We need to take your photo for security purposes and visitor identification.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                {photo ? (
                  <div className="space-y-4">
                    <img
                      src={photo}
                      alt="Captured photo"
                      className="w-48 h-48 rounded-lg object-cover mx-auto border-2 border-gray-300"
                    />
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => setPhoto(null)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                      <Camera className="h-12 w-12 text-gray-400" />
                    </div>
                    <Button onClick={() => setIsPhotoModalOpen(true)}>
                      <Camera className="mr-2 h-4 w-4" />
                      Capture Photo
                    </Button>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Photo Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Face the camera directly</li>
                    <li>• Ensure good lighting</li>
                    <li>• Remove hats and sunglasses</li>
                    <li>• Use a plain background</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={submitRegistration}
                    disabled={!photo || registrationMutation.isPending}
                  >
                    {registrationMutation.isPending ? "Submitting..." : "Complete Registration"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && registrationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600">Registration Complete!</CardTitle>
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
                    {personalInfo?.firstName} {personalInfo?.lastName}
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
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Printer className="mr-2 h-4 w-4" />
                    Printer Badge
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStep(1);
                      setPersonalInfo(null);
                      setPhoto(null);
                      setRegistrationResult(null);
                      form.reset();
                    }}
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
          visitorName={`${personalInfo?.firstName} ${personalInfo?.lastName}`}
        />
      )}
    </div>
  );
}
