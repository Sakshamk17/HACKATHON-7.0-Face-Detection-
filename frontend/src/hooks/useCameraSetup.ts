import { useCameraDevice, CameraDevice, useCameraPermission } from 'react-native-vision-camera';

type CameraSetupResult = {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  device: CameraDevice | undefined;
};

export const useCameraSetup = (): CameraSetupResult => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  return {
    hasPermission,
    requestPermission,
    device,
  };
};
