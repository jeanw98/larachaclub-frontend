// @ts-expect-error sin tipos oficiales
import piexif from 'piexifjs';

function dataUrlToJpegWithGps(dataUrl: string, lat: number, lng: number): string {
  const gps: Record<number, unknown> = {};
  gps[piexif.GPSIFD.GPSLatitudeRef] = lat < 0 ? 'S' : 'N';
  gps[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lat));
  gps[piexif.GPSIFD.GPSLongitudeRef] = lng < 0 ? 'W' : 'E';
  gps[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lng));

  const exifObj = { GPS: gps };
  const exifBytes = piexif.dump(exifObj);
  return piexif.insert(exifBytes, dataUrl);
}

export async function canvasToJpegFileWithGps(
  canvas: HTMLCanvasElement,
  lat: number,
  lng: number,
  filename = 'camara.jpg'
): Promise<File> {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const withGps = dataUrlToJpegWithGps(dataUrl, lat, lng);

  const res = await fetch(withGps);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/jpeg', lastModified: Date.now() });
}

export function blobToFile(blob: Blob, filename: string, type: string): File {
  return new File([blob], filename, { type, lastModified: Date.now() });
}
