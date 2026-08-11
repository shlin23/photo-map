import { MAX_FILES_PER_UPLOAD } from "@/lib/photos/constants";

export function getUploadSelectionState(count: number, isUploading: boolean) {
  const hasSelection = count > 0;
  const hasValidCount = hasSelection && count <= MAX_FILES_PER_UPLOAD;

  return {
    showUploadButton: hasSelection,
    disableUploadButton: !hasValidCount || isUploading,
  };
}
