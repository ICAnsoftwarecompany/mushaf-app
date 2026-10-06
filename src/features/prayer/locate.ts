/**
 * تحديد الموقع: GPS + أقرب مدينة من قايمة المدن (من غير إنترنت)،
 * واختياري: اسم المدينة من خدمة الخرائط في نظام الموبايل (محتاج إنترنت).
 */
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { SavedLocation } from '@/store/settings-store';

import { cityToLocation, nearestCity } from './prayer';

export type LocateResult = { ok: true; location: SavedLocation } | { ok: false; reason: 'denied' | 'failed' };

export async function detectLocation(useInternet: boolean): Promise<LocateResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude: lat, longitude: lng } = pos.coords;
    const near = cityToLocation(nearestCity(lat, lng), 'gps');
    const loc: SavedLocation = { ...near, lat, lng, source: 'gps' };
    if (useInternet && Platform.OS !== 'web') {
      try {
        const [g] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const name = g?.city || g?.subregion || g?.region;
        if (name) {
          loc.name = name;
          loc.nameAr = undefined;
        }
        if (g?.isoCountryCode) loc.country = g.isoCountryCode.toUpperCase();
      } catch {
        // بنكمّل باسم أقرب مدينة
      }
    }
    return { ok: true, location: loc };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
