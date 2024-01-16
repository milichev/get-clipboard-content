/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line import/no-extraneous-dependencies
import "@total-typescript/ts-reset/filter-boolean";

import type { ArrayItems } from "./types";

const HTML_TYPE = "text/html";
const TEXT_TYPE = "text/plain";
const STRING_TYPES = [TEXT_TYPE, HTML_TYPE] as const;

const PNG_TYPE = "image/png";
const JPEG_TYPE = "image/jpeg";
const BUFFER_TYPES = [PNG_TYPE, JPEG_TYPE] as const;

type StringType = (typeof STRING_TYPES)[number];
type BufferType = (typeof BUFFER_TYPES)[number];
type ContentType = StringType | BufferType;

type Result = string | ArrayBuffer;

type ContentByType<T extends ContentType> = T extends typeof HTML_TYPE
  ? string
  : T extends typeof TEXT_TYPE
    ? string
    : T extends typeof PNG_TYPE
      ? ArrayBuffer
      : T extends typeof JPEG_TYPE
        ? ArrayBuffer
        : never;

const getContent = async <T extends ContentType>(type: T, content: Blob) => {
  switch (type) {
    case TEXT_TYPE:
    case HTML_TYPE:
      return content.text();
    case PNG_TYPE:
    case JPEG_TYPE:
      return content.arrayBuffer();
    default: {
      const tsCheck: never = type;
      throw new Error(`Unexpected content type "${tsCheck}"`);
    }
  }
};

const getClipboardContent = async <
  T extends readonly ContentType[],
  R extends Result = ContentByType<ArrayItems<T>>,
>(
  types: T,
) => {
  try {
    const clipboardItems = await navigator.clipboard.read();
    const htmlPromises = clipboardItems
      .map((item) => ({
        item,
        types: types.map((type) => (item.types.includes(type) ? type : null)),
      }))
      .map(({ item, types: itemTypes }) =>
        itemTypes.filter(Boolean).map((type: ContentType) => ({
          type,
          content: item.getType(type).then((blob) => getContent(type, blob)),
        })),
      )
      .flat()
      .filter(Boolean);

    const result = (await Promise.all(htmlPromises)).find(Boolean);
    return result
      ? { type: result.type, content: (await result.content) as R }
      : null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error occurred while getting the clipboard content", e);
    return null;
  }
};

export const getClipboardString = async () => getClipboardContent(STRING_TYPES);
export const getClipboardBuffer = async () => getClipboardContent(BUFFER_TYPES);

/**
 * Tries to get HTML content from clipboard as a string
 * representing the formatted text, if any; otherwise `null`
 */
export const getClipboardHtml = async () => {
  const result = await getClipboardContent([HTML_TYPE] as const);
  return result ? result.content : null;
};
