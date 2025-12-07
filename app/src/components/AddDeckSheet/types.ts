import { ReactNode } from "react";

export interface AddDeckSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreateWithAI: () => void;
  onCreateManual: () => void;
  onImportAnki: () => void;
}

export interface AddDeckOptionProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  isPrimary?: boolean;
}
