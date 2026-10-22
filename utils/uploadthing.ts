import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import { genUploader } from "uploadthing/client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { apiUrl } from "@/lib/base-path";

// O app roda com basePath (/fest): sem isso o UploadThing chamaria /api/uploadthing na raiz
const url = apiUrl("/api/uploadthing");

export const UploadButton = generateUploadButton<OurFileRouter>({ url });
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({ url });
export const { uploadFiles } = genUploader<OurFileRouter>({ url });
