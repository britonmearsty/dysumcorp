import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/api/",
                "/dashboard/",
                "/settings/",
                "/auth/",
                "/profile/",
                "/portal/", // These are private portal links
                "/error",
            ],
        },
        sitemap: "https://dysumcorp.pro/sitemap.xml",
    };
}
