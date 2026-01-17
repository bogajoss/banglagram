import React, { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useUpdateProfile } from "../../hooks/mutations/useUpdateProfile";
import { useAuth } from "../../hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const EditProfileModal: React.FC = () => {
  const { currentUser, isEditProfileOpen, setEditProfileOpen } = useAppStore();
  const { user } = useAuth();
  const { mutate: updateProfileMutation, isPending } = useUpdateProfile();

  const [avatar, setAvatar] = useState(currentUser.avatar);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser.name,
      bio: currentUser.bio || "",
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatar(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onClose = () => setEditProfileOpen(false);

  const onSubmit = (values: ProfileFormValues) => {
    if (!user) return;
    updateProfileMutation(
      {
        userId: user.id,
        name: values.name,
        bio: values.bio || "",
        avatar,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={isEditProfileOpen} onOpenChange={setEditProfileOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none sm:rounded-xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center font-bold">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="p-6 flex flex-col gap-4 bg-background text-foreground">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatar} />
              <AvatarFallback>
                {currentUser.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-lg">
                {currentUser.username}
              </div>
              <label className="text-primary text-sm font-bold cursor-pointer hover:underline">
                Change profile photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-transparent" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-transparent h-24 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#006a4e] hover:bg-[#00523c] text-white font-bold"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;