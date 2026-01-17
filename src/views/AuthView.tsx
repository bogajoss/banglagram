import { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
}).refine(() => {
  // Add custom logic if needed, e.g. username is required for signup
  return true;
});



type AuthFormValues = z.infer<typeof authSchema>;



export default function AuthView() {

  const { signIn, signUp, resetPassword } = useAuth();

  const { showToast } = useAppStore();

  const [isLogin, setIsLogin] = useState(true);

  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);



  const form = useForm<AuthFormValues>({

    resolver: zodResolver(authSchema),

    defaultValues: {

      email: "",

      password: "",

      username: "",

      fullName: "",

    },

  });



  const onSubmit = async (values: AuthFormValues) => {

    setLoading(true);

    setError(null);

    try {

      if (forgotPasswordMode) {

        const { error: resetError } = await resetPassword(values.email);

        if (resetError) throw resetError;

        showToast("Password reset link sent to your email");

        setForgotPasswordMode(false);

        setIsLogin(true);

      } else if (isLogin) {

        const { error: signInError } = await signIn(values.email, values.password);

        if (signInError) throw signInError;

      } else {

        if (!values.username || !values.fullName) {

          setError("Username and Full Name are required for sign up");

          return;

        }

        const { error: signUpError } = await signUp(values.email, values.password, {

          username: values.username,

          full_name: values.fullName,

          avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${values.username}`,

        });

        if (signUpError) throw signUpError;

        setIsRegistrationSuccess(true);

      }

    } catch (err: unknown) {

      setError(err instanceof Error ? err.message : String(err));

    } finally {

      setLoading(false);

    }

  };



  if (isRegistrationSuccess) {

    return (

      <div

        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 bg-muted"

      >



        <Card className="w-full max-w-md shadow-2xl border-none text-center">

          <CardContent className="pt-6">

            <div className="mx-auto w-16 h-16 bg-[#006a4e]/10 rounded-full flex items-center justify-center mb-6">

              <Mail size={32} className="text-[#006a4e]" />

            </div>

            <h2

              className="text-2xl font-bold mb-2 text-foreground"

            >

              Check your email

            </h2>

            <p className="text-sm mb-8 text-muted-foreground">

              We have sent a verification link to your email.

              Please verify your email to continue.

            </p>



            <Button

              onClick={() => {

                setIsRegistrationSuccess(false);

                setIsLogin(true);

              }}

              className="w-full bg-[#006a4e] hover:bg-[#00523c] text-white font-bold"

            >

              Back to Login

            </Button>

          </CardContent>

        </Card>

      </div>

    );

  }



  return (

    <div

      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 bg-muted"

    >

      <Card className="w-full max-w-md shadow-2xl border-none">

        <CardHeader className="space-y-1 flex flex-col items-center">

          <img src="/icon.png" alt="Banglagram Logo" className="w-16 h-16 object-contain mb-2" />

          <CardTitle className="text-3xl font-bold text-[#006a4e]">Banglagram</CardTitle>

          <CardDescription className="text-center">

            {forgotPasswordMode

              ? "Reset your password"

              : isLogin

                ? "Log in to your account"

                : "Create new account"}

          </CardDescription>

        </CardHeader>

        <CardContent>



          {error && (

            <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-lg text-sm mb-6 text-center">

              {error}

            </div>

          )}



          <Form {...form}>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {!isLogin && (

                <>

                  <FormField

                    control={form.control}

                    name="username"

                    render={({ field }) => (

                      <FormItem>

                        <FormLabel>Username</FormLabel>

                        <FormControl>

                          <Input placeholder="Provide a username" {...field} />

                        </FormControl>

                        <FormMessage />

                      </FormItem>

                    )}

                  />

                  <FormField

                    control={form.control}

                    name="fullName"

                    render={({ field }) => (

                      <FormItem>

                        <FormLabel>Full Name</FormLabel>

                        <FormControl>

                          <Input placeholder="Your Full Name" {...field} />

                        </FormControl>

                        <FormMessage />

                      </FormItem>

                    )}

                  />

                </>

              )}

              <FormField

                control={form.control}

                name="email"

                render={({ field }) => (

                  <FormItem>

                    <FormLabel>Email</FormLabel>

                    <FormControl>

                      <Input placeholder="email@example.com" {...field} />

                    </FormControl>

                    <FormMessage />

                  </FormItem>

                )}

              />

              {!forgotPasswordMode && (

                <FormField

                  control={form.control}

                  name="password"

                  render={({ field }) => (

                    <FormItem>

                      <div className="flex items-center justify-between">

                        <FormLabel>Password</FormLabel>

                        {isLogin && (

                          <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setForgotPasswordMode(true)}>

                            Forgot Password?

                          </Button>

                        )}

                      </div>

                      <FormControl>

                        <Input type="password" placeholder="••••••••" {...field} />

                      </FormControl>

                      <FormMessage />

                    </FormItem>

                  )}

                />

              )}



              <Button

                type="submit"

                disabled={loading}

                className="w-full bg-[#006a4e] hover:bg-[#00523c] text-white font-bold"

              >

                {loading ? (

                  <>

                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                    Processing...

                  </>

                ) : forgotPasswordMode ? (

                  "Reset Password"

                ) : isLogin ? (

                  "Log In"

                ) : (

                  "Sign Up"

                )}

              </Button>

            </form>

          </Form>



          <div className="relative my-8">

            <div className="absolute inset-0 flex items-center">

              <span className="w-full border-t" />

            </div>

            <div className="relative flex justify-center text-xs uppercase">

              <span className="bg-background px-2 text-muted-foreground">

                or continue with

              </span>

            </div>

          </div>


              <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => showToast("Google login coming soon")} className="w-full">
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button variant="outline" onClick={() => showToast("Apple login coming soon")} className="w-full">
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 fill-current">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              Github
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            {forgotPasswordMode ? (
              <Button
                variant="link"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setIsLogin(true);
                  setError(null);
                }}
                className="text-[#006a4e]"
              >
                Back to Login
              </Button>
            ) : (
              <p>
                {isLogin
                  ? "Need a new account?"
                  : "Already have an account?"}
                <Button
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="text-[#006a4e] font-bold"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </Button>
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
