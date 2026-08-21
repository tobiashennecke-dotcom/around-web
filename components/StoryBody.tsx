import { PortableText } from "@portabletext/react";

const components: any = {
  types: {
    image: ({value}: any) => {
      if (!value?.url) return null;
      const layout = value.layout || "wide";
      return (
        <figure className={`storyImage storyImage--${layout}`}>
          <img src={value.url} alt={value.alt || ""} loading="lazy" />
          {(value.caption || value.credit) && (
            <figcaption>
              {value.caption && <span>{value.caption}</span>}
              {value.credit && <small>{value.credit}</small>}
            </figcaption>
          )}
        </figure>
      );
    }
  },
  block: {
    h2: ({children}: any) => <h2>{children}</h2>,
    h3: ({children}: any) => <h3>{children}</h3>,
    pullQuote: ({children}: any) => <div className="pull">{children}</div>,
    blockquote: ({children}: any) => <blockquote className="storyQuote">{children}</blockquote>
  },
  marks: {
    link: ({children,value}: any) => (
      <a href={value?.href || "#"} target={value?.blank ? "_blank" : undefined} rel={value?.blank ? "noreferrer" : undefined}>
        {children}
      </a>
    )
  }
};

export function StoryBody({value}:{value:unknown[]}) {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.every(item => typeof item === "string")) {
    return <>{(value as string[]).map((text,index)=><p key={index}>{text}</p>)}</>;
  }
  return <PortableText value={value as any} components={components} />;
}
