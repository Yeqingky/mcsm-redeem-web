import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-left"
      duration={3000}
      richColors
      toastOptions={{ className: "copy-toast" }}
      {...props}
    />
  );
}

export { Toaster };
