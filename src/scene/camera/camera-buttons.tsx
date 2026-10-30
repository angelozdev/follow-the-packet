import { CAMERA_TEXT } from '@/copy';
import { Button } from '@/design';

interface CameraButtonsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function CameraButtons({ onZoomIn, onZoomOut, onFit }: CameraButtonsProps) {
  return (
    <div className="camera-buttons">
      <Button variant="small" aria-label={CAMERA_TEXT.zoomIn} onClick={onZoomIn}>
        {CAMERA_TEXT.zoomInSign}
      </Button>
      <Button variant="small" aria-label={CAMERA_TEXT.zoomOut} onClick={onZoomOut}>
        {CAMERA_TEXT.zoomOutSign}
      </Button>
      <Button variant="small" onClick={onFit}>
        {CAMERA_TEXT.fit}
      </Button>
    </div>
  );
}
