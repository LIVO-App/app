/**
 * Device ID Service
 * Generates unique device identifiers for authentication
 */

import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";

/**
 * Generate a unique device identifier
 * Format: {userId}_{userType}_{deviceUuid}
 */
export async function generateDeviceId(
  userId: number,
  userType: string
): Promise<string> {
  const deviceUuid = await getDeviceUuid();
  return `${userId}_${userType}_${deviceUuid}`;
}

/**
 * Get unique device UUID
 * - Mobile: Use native device UUID
 * - Web: Generate browser fingerprint
 */
export async function getDeviceUuid(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    // Mobile: Use native device identifier
    try {
      const info = await Device.getId();
      return info.identifier; // Android: ANDROID_ID, iOS: UUID
    } catch (error) {
      return Math.random().toString(36).substring(7, 15);
    }
  } else {
    // Web: Generate browser fingerprint
    return generateBrowserFingerprint();
  }
}

/**
 * Generate browser fingerprint based on browser characteristics
 * More stable than random ID, persists across sessions
 */
function generateBrowserFingerprint(): string {
  // Collect browser characteristics
  const fingerprint = {
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    screenResolution: `${screen.width}x${screen.height}`,
  };

  // Create hash from fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  return hashString(fingerprintString);
}

/**
 * Simple hash function (FNV-1a)
 */
function hashString(str: string): string {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36); // Convert to base36 string
}

/**
 * Get device information for logging/debugging
 */
export async function getDeviceInfo(): Promise<{
  model: string;
  platform: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
}> {
  if (Capacitor.isNativePlatform()) {
    const info = await Device.getInfo();
    return {
      model: info.model,
      platform: info.platform,
      osVersion: info.osVersion,
      manufacturer: info.manufacturer,
      isVirtual: info.isVirtual,
    };
  } else {
    // Extract browser name from user agent
    const ua = navigator.userAgent;
    let browserName = "Unknown Browser";

    if (ua.includes("Edg")) browserName = "Edge";
    else if (ua.includes("Chrome")) browserName = "Chrome";
    else if (ua.includes("Firefox")) browserName = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      browserName = "Safari";

    return {
      model: "Browser",
      platform: "web",
      osVersion: navigator.userAgent,
      manufacturer: browserName,
      isVirtual: false,
    };
  }
}

/**
 * Get a human-readable device name
 */
export async function getDeviceName(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const info = await Device.getInfo();
    return `${info.manufacturer} ${info.model}`;
  } else {
    // Extract browser name from user agent
    const ua = navigator.userAgent;
    if (ua.includes("Edg")) return "Edge Browser";
    if (ua.includes("Chrome")) return "Chrome Browser";
    if (ua.includes("Firefox")) return "Firefox Browser";
    if (ua.includes("Safari") && !ua.includes("Chrome"))
      return "Safari Browser";
    return "Web Browser";
  }
}
