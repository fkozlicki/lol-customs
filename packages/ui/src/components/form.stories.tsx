import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { Button } from "./button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";

const meta = {
  title: "Components/Form",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;

type Story = StoryObj;

interface Values {
  nickname: string;
}

/** The sign-in dialog is the one form in the app; its labels are `label-caps` like every other. */
function ProfileForm({ error }: { error?: string }) {
  const form = useForm<Values>({ defaultValues: { nickname: "" } });

  return (
    <Form {...form}>
      <form className="w-80 space-y-6">
        <FormField
          control={form.control}
          name="nickname"
          rules={{ required: error }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="label-caps">Nickname</FormLabel>
              <FormControl>
                <Input placeholder="How the forum sees you" {...field} />
              </FormControl>
              <FormDescription>
                Shown on your posts and comments.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button" onClick={() => form.trigger()}>
          Save
        </Button>
      </form>
    </Form>
  );
}

export const Default: Story = {
  render: () => <ProfileForm />,
};

/** Press Save with the field empty to see the message; it is the one place destructive text appears. */
export const WithValidation: Story = {
  render: () => <ProfileForm error="A nickname is required." />,
};
