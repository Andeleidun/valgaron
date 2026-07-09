import { valgaronPrivacyPolicy } from '@valgaron/core';
import privacyPolicyMarkdown from '../../PRIVACY.md?raw';
import { parsePolicyMarkdown } from '../Utlilities/policyMarkdown';

export function PrivacyPage() {
  const policyBlocks = parsePolicyMarkdown(privacyPolicyMarkdown);

  return (
    <main className="vwb-main vwb-privacy-page" id="main-content" tabIndex={-1}>
      <article
        className="vwb-panel vwb-policy-document"
        aria-label={valgaronPrivacyPolicy.title}
      >
        {policyBlocks.map((block, index) => {
          switch (block.kind) {
            case 'heading': {
              const HeadingTag = `h${block.level}` as const;
              return (
                <HeadingTag id={block.id} key={`${block.id}-${index}`}>
                  {block.text}
                </HeadingTag>
              );
            }
            case 'paragraph':
              return <p key={`${block.kind}-${index}`}>{block.text}</p>;
            case 'unordered-list':
              return (
                <ul key={`${block.kind}-${index}`}>
                  {block.items.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              );
            case 'ordered-list':
              return (
                <ol key={`${block.kind}-${index}`}>
                  {block.items.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>{item}</li>
                  ))}
                </ol>
              );
            case 'rule':
              return <hr key={`${block.kind}-${index}`} />;
          }
        })}
      </article>
    </main>
  );
}
