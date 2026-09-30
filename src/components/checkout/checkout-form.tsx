"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { startCheckout } from "@/app/actions/checkout";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";

type CheckoutFormProps = {
  email: string;
  defaultName: string;
  totalLabel: string;
};

export function CheckoutForm({ email, defaultName, totalLabel }: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isBusy = isPending || isRedirecting;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: defaultName,
      phone: "",
      address: "",
      city: "",
      state: "",
    },
  });

  function onSubmit(values: CheckoutInput) {
    startTransition(async () => {
      const result = await startCheckout(values);

      if (result.ok) {
        setIsRedirecting(true);
        window.location.assign(result.paymentUrl);
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <p className="text-sm font-medium">Email</p>
        <p className="text-sm text-muted-foreground">
          {email}. Your confirmation will be sent here.
        </p>
      </div>

      <FormField
        id="fullName"
        label="Full name"
        autoComplete="name"
        className="h-11"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <FormField
        id="phone"
        label="Phone number"
        type="tel"
        autoComplete="tel"
        placeholder="0801 234 5678"
        className="h-11"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <FormField
        id="address"
        label="Delivery address"
        autoComplete="street-address"
        placeholder="House number and street"
        className="h-11"
        error={errors.address?.message}
        {...register("address")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="city"
          label="City"
          autoComplete="address-level2"
          className="h-11"
          error={errors.city?.message}
          {...register("city")}
        />
        <FormField
          id="state"
          label="State"
          autoComplete="address-level1"
          className="h-11"
          error={errors.state?.message}
          {...register("state")}
        />
      </div>

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isBusy}>
        <Lock />
        {isBusy ? "Taking you to Paystack…" : `Pay ${totalLabel}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        You&rsquo;ll pay securely on Paystack. We never see your card details.
      </p>
    </form>
  );
}