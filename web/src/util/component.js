import React from "react";

import DOMPurify, { sanitize } from "dompurify";
import { link } from "autolinker";

export const withCss = (Comp, style) => (
    withProps(Comp, { style: style })
)

export const withProps = (Comp, values) => (props) => (
    React.cloneElement(React.createElement(Comp, props), values)
)

// https://github.com/cure53/DOMPurify/blob/master/demos/hooks-target-blank-demo.html#L31
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if ("target" in node) {
        node.setAttribute("target", "_blank");
    }
    if (!node.hasAttribute("target")
        && (node.hasAttribute("xlink:href") || node.hasAttribute("href"))
    ) {
        node.setAttribute("xlink:show", "new");
    }
});

function allowOnlyLinks(str) {
    const regex = /<(?!(a\s|\/))/g;
    // const regex = new RegExp(
    //     "<(?!(" + tags.map(tag => tag + "(\\s|>)").join("|") + "|\/))",
    //     "g"
    // );
    // sanitize does need to be here
    // so that js cannot be inside an anchor
    return sanitize(str.replace(regex, "&lt;"));
}

function addLinks(text) {
    return link(text, {
        newWindow: true,
        urls: true,
        email: false,
        phone: false,
        mention: false,
        hashtag: false,
        stripPrefix: false,
        stripTrailingSlash: false,
        decodePercentEncoding: false,
    });
}

function formatForHtml(text) {
    let replacements = [
        [/&/g, "&amp;"],
        [/</g, "&lt;"],
        [/>/g, "&gt;"]
    ];
    for (let replacement of replacements) {
        text = text.replace(replacement[0], replacement[1]);
    }
    return text;
}

export function getLinkifiedHtml(text) {
    return allowOnlyLinks(addLinks(formatForHtml(text)));
}
