/** قراءة ملف asset نصي (أندرويد و iOS) */
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

export async function loadAssetText(mod: number): Promise<string> {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  return new File(asset.localUri ?? asset.uri).text();
}
