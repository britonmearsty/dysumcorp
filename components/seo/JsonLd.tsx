import React from "react";

interface JsonLdProps {
    data: Record<string, any>;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
    return (
        <script
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            type="application/ld+json"
        />
    );
};

export const OrganizationJsonLd = () => {
    const data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Dysumcorp",
        url: "https://dysumcorp.pro",
        logo: "https://dysumcorp.pro/logo.png",
        sameAs: [
            "https://twitter.com/dysumcorp",
            // Add other social links here
        ],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: "support@dysumcorp.pro",
        },
    };
    return <JsonLd data={data} />;
};

export const WebsiteJsonLd = () => {
    const data = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Dysumcorp",
        url: "https://dysumcorp.pro",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: "https://dysumcorp.pro/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
        },
    };
    return <JsonLd data={data} />;
};
