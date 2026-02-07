import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import { title, subtitle } from "@/components/primitives";
import { FileTextIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-20 md:py-32">
      <div className="p-6 rounded-full bg-default-100 text-default-500 mb-2">
        <FileTextIcon size={64} />
      </div>
      <Chip color="warning" variant="flat">
        Error 404
      </Chip>
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title({ size: "lg" })}>Page&nbsp;</h1>
        <h1 className={title({ color: "warm", size: "lg" })}>not found</h1>
        <p className={subtitle({ class: "mt-4" })}>
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
      </div>
      <Button
        as={Link}
        className="mt-4"
        color="primary"
        href="/"
        size="lg"
        variant="solid"
      >
        Go Back Home
      </Button>
    </div>
  );
}
