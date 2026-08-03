import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      duration={5000}
      richColors
      toastOptions={{ className: "copy-toast" }}
      {...props}
    />
  );
}

export { Toaster };
