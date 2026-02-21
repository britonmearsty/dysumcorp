"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Script from "next/script";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export const FacebookPixel = () => {
    const [loaded, setLoaded] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (loaded && window.fbq) {
            window.fbq("track", "PageView");
        }
    }, [pathname, loaded]);

    if (!FB_PIXEL_ID || FB_PIXEL_ID === "your_facebook_pixel_id_here") {
        return null;
    }

    return (
        <>
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                src={`https://connect.facebook.net/en_US/fbevents.js`}
                onLoad={() => {
                    setLoaded(true);
                    window.fbq("init", FB_PIXEL_ID);
                    window.fbq("track", "PageView");
                }}
            />
            <noscript>
                <img
                    alt=""
                    height="1"
                    src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                    style={{ display: "none" }}
                    width="1"
                />
            </noscript>
        </>
    );
};

// Extend the Window interface for TypeScript
declare global {
    interface Window {
        fbq: any;
        _fbq: any;
    }
}
