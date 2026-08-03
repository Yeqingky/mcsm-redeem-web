import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      duration={5000}
      visibleToasts={3}
      expand
      richColors
      {...props}
    />
  );
}

export { Toaster };
