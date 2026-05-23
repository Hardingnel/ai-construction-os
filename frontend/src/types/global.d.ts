export {};

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      selectFile: (options: any) => Promise<any>;
      saveFile: (options: any) => Promise<any>;
      onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
      onUpdateChecking: (callback: () => void) => void;
      onUpdateAvailable: (callback: (info: any) => void) => void;
      onUpdateProgress: (callback: (progress: any) => void) => void;
      onUpdateDownloaded: (callback: (info: any) => void) => void;
    };
  }
}
