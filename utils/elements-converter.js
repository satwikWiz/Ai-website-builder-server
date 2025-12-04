import { v4 as uuidv4 } from 'uuid';

/**
 * Convert HTML to editor elements structure
 */
export function convertHtmlToEditorElements(html) {
  return [
    {
      content: [
        {
          content: { innerText: html },
          id: uuidv4(),
          name: 'RichText',
          styles: {},
          type: 'RichText',
        },
      ],
      id: '__body',
      name: 'Body',
      styles: {},
      type: '__body',
    },
  ];
}

