import { Type } from "@sinclair/typebox";
import { createModifier, StaticModifier } from "./modifier";

/** Only set this key if it doesn't already exist */
export const NX = /* #__PURE__ */ createModifier("NX");
export type NX = StaticModifier<typeof NX>;

/** Only set this key if it already exists */
export const XX = /* #__PURE__ */ createModifier("XX");
export type XX = StaticModifier<typeof XX>;

/** Set expiry only when the new expiry is greater than current one */
export const GT = /* #__PURE__ */ createModifier("GT");
export type GT = StaticModifier<typeof GT>;

/** Set expiry only when the new expiry is less than current one */
export const LT = /* #__PURE__ */ createModifier("LT");
export type LT = StaticModifier<typeof LT>;

/** Expiry in seconds */
export const EX = /* #__PURE__ */ createModifier("EX", Type.Number());
export type EX = StaticModifier<typeof EX>;

/** Expiry at specified Unix time, in seconds */
export const EXAT = /* #__PURE__ */ createModifier("EXAT", Type.Number());
export type EXAT = StaticModifier<typeof EXAT>;

/** Expiry in milliseconds */
export const PX = /* #__PURE__ */ createModifier("PX", Type.Number());
export type PX = StaticModifier<typeof PX>;

/** Expiry at specified Unix time, in milliseconds */
export const PXAT = /* #__PURE__ */ createModifier("PXAT", Type.Number());
export type PXAT = StaticModifier<typeof PXAT>;

/** Retain the time to live associated with the key */
export const KEEPTTL = /* #__PURE__ */ createModifier("KEEPTTL");
export type KEEPTTL = StaticModifier<typeof KEEPTTL>;

/** Remove the time to live associated with the key */
export const PERSIST = /* #__PURE__ */ createModifier("PERSIST");
export type PERSIST = StaticModifier<typeof PERSIST>;

//
// Full Text Search
//

/** Currently supports HASH (default) and JSON. To index JSON, you must have the RedisJSON module installed. */
export const ON = /* #__PURE__ */ createModifier(
  "ON",
  Type.Union([Type.Literal("hash"), Type.Literal("json")]),
);
export type ON = StaticModifier<typeof ON>;

/** Tells the index which keys it should index. You can add several prefixes to index. Because the argument is optional, the default is `*` (all keys). */
export const PREFIX = /* #__PURE__ */ createModifier(
  "PREFIX",
  Type.Array(Type.String()),
);
export type PREFIX = StaticModifier<typeof PREFIX>;

/**
 * Filter expression with the full RediSearch aggregation expression
 * language. It is possible to use `@__key` to access the key that was just
 * added/changed.
 *
 * A field can be used to set field name by passing: FILTER
 * \@indexName=="myindexname"
 */
export const FILTER = /* #__PURE__ */ createModifier("FILTER", Type.String());
export type FILTER = StaticModifier<typeof FILTER>;

/** If set, indicates the default language for documents in the index. Default is `English`. */
export const LANGUAGE = /* #__PURE__ */ createModifier(
  "LANGUAGE",
  Type.String(),
);
export type LANGUAGE = StaticModifier<typeof LANGUAGE>;

/** A document attribute set as the document language. */
export const LANGUAGE_FIELD = /* #__PURE__ */ createModifier(
  "LANGUAGE_FIELD",
  Type.String(),
);
export type LANGUAGE_FIELD = StaticModifier<typeof LANGUAGE_FIELD>;

/** Default score for documents in the index. Default score is `1.0`. */
export const SCORE = /* #__PURE__ */ createModifier("SCORE", Type.Number());
export type SCORE = StaticModifier<typeof SCORE>;

/** Document attribute that you use as the document rank based on the user ranking. Ranking must be between `0.0` and `1.0`. If not set, the default score is `1`. */
export const SCORE_FIELD = /* #__PURE__ */ createModifier(
  "SCORE_FIELD",
  Type.String(),
);
export type SCORE_FIELD = StaticModifier<typeof SCORE_FIELD>;

/** Document attribute that you use as a binary safe payload string to the document that can be evaluated at query time by a custom scoring function or retrieved to the client. */
export const PAYLOAD_FIELD = /* #__PURE__ */ createModifier(
  "PAYLOAD_FIELD",
  Type.String(),
);
export type PAYLOAD_FIELD = StaticModifier<typeof PAYLOAD_FIELD>;

/** Forces RediSearch to encode indexes as if there were more than 32 text attributes, which allows you to add additional attributes (beyond 32) using FT.ALTER. For efficiency, RediSearch encodes indexes differently if they are created with less than 32 text attributes. */
export const MAXTEXTFIELDS = /* #__PURE__ */ createModifier("MAXTEXTFIELDS");
export type MAXTEXTFIELDS = StaticModifier<typeof MAXTEXTFIELDS>;

/** Does not store term offsets for documents. It saves memory, but does not allow exact searches or highlighting. It implies NOHL. */
export const NOOFFSETS = /* #__PURE__ */ createModifier("NOOFFSETS");
export type NOOFFSETS = StaticModifier<typeof NOOFFSETS>;

/** Conserves storage space and memory by disabling highlighting support. If set, the corresponding byte offsets for term positions are not stored. NOHL is also implied by NOOFFSETS. */
export const NOHL = /* #__PURE__ */ createModifier("NOHL");
export type NOHL = StaticModifier<typeof NOHL>;

/** Do not store field names in the index. */
export const NOFIELDS = /* #__PURE__ */ createModifier("NOFIELDS");
export type NOFIELDS = StaticModifier<typeof NOFIELDS>;

/** Disable storing term frequencies in the index. */
export const NOFREQS = /* #__PURE__ */ createModifier("NOFREQS");
export type NOFREQS = StaticModifier<typeof NOFREQS>;

/** Skip the initial full scan of the dataset. */
export const SKIPINITIALSCAN =
  /* #__PURE__ */ createModifier("SKIPINITIALSCAN");
export type SKIPINITIALSCAN = StaticModifier<typeof SKIPINITIALSCAN>;

/** Define custom stopwords to be ignored during indexing and query time. */
export const STOPWORDS = /* #__PURE__ */ createModifier(
  "STOPWORDS",
  Type.Array(Type.String()),
);
export type STOPWORDS = StaticModifier<typeof STOPWORDS>;

/** When performing a FT.SEARCH query, only return the document IDs and not the content. */
export const NOCONTENT = /* #__PURE__ */ createModifier("NOCONTENT");
export type NOCONTENT = StaticModifier<typeof NOCONTENT>;

/** When performing a FT.SEARCH query, execute a verbatim search. */
export const VERBATIM = /* #__PURE__ */ createModifier("VERBATIM");
export type VERBATIM = StaticModifier<typeof VERBATIM>;

/** When performing a FT.SEARCH query, ignore stopwords. */
export const NOSTOPWORDS = /* #__PURE__ */ createModifier("NOSTOPWORDS");
export type NOSTOPWORDS = StaticModifier<typeof NOSTOPWORDS>;

/** When performing a FT.SEARCH query, return scores with the results. */
export const WITHSCORES = /* #__PURE__ */ createModifier("WITHSCORES");
export type WITHSCORES = StaticModifier<typeof WITHSCORES>;

/** When performing a FT.SEARCH query, return payloads with the results. */
export const WITHPAYLOADS = /* #__PURE__ */ createModifier("WITHPAYLOADS");
export type WITHPAYLOADS = StaticModifier<typeof WITHPAYLOADS>;

/** When performing a FT.SEARCH query, return sort keys with the results. */
export const WITHSORTKEYS = /* #__PURE__ */ createModifier("WITHSORTKEYS");
export type WITHSORTKEYS = StaticModifier<typeof WITHSORTKEYS>;

/** When performing a FT.SEARCH query, filter results by numeric range. */
export const FILTER_NUMERIC = /* #__PURE__ */ createModifier(
  "FILTER",
  Type.Array(Type.Union([Type.String(), Type.Number()])),
);
export type FILTER_NUMERIC = StaticModifier<typeof FILTER_NUMERIC>;

/** When performing a FT.SEARCH query, filter results by جغرافیایی distance. */
export const GEOFILTER = /* #__PURE__ */ createModifier(
  "GEOFILTER",
  Type.Array(
    Type.Union([
      Type.String(),
      Type.Number(),
      Type.Literal("m"),
      Type.Literal("km"),
      Type.Literal("mi"),
      Type.Literal("ft"),
    ]),
  ),
);
export type GEOFILTER = StaticModifier<typeof GEOFILTER>;

/** When performing a FT.SEARCH query, limit results to a set of keys. */
export const INKEYS = /* #__PURE__ */ createModifier(
  "INKEYS",
  Type.Array(Type.String()),
);
export type INKEYS = StaticModifier<typeof INKEYS>;

/** When performing a FT.SEARCH query, limit results to a set of fields. */
export const INFIELDS = /* #__PURE__ */ createModifier(
  "INFIELDS",
  Type.Array(Type.String()),
);
export type INFIELDS = StaticModifier<typeof INFIELDS>;

/** When performing a FT.SEARCH query, control which fields from the document are returned. */
export const RETURN = /* #__PURE__ */ createModifier(
  "RETURN",
  Type.Array(Type.Union([Type.String(), Type.Literal("AS")])),
);
export type RETURN = StaticModifier<typeof RETURN>;

/** When performing a FT.SEARCH query, return only the sections of the attribute that contain the matched text. */
export const SUMMARIZE = /* #__PURE__ */ createModifier("SUMMARIZE");
export type SUMMARIZE = StaticModifier<typeof SUMMARIZE>;

/** When performing a FT.SEARCH query, format occurrences of matched text. */
export const HIGHLIGHT = /* #__PURE__ */ createModifier("HIGHLIGHT");
export type HIGHLIGHT = StaticModifier<typeof HIGHLIGHT>;

/** When performing a FT.SEARCH query, allow a maximum edit distance for matching terms in the query. */
export const SLOP = /* #__PURE__ */ createModifier("SLOP", Type.Number());
export type SLOP = StaticModifier<typeof SLOP>;

/** When performing a FT.SEARCH query, set a timeout for processing the query. */
export const TIMEOUT = /* #__PURE__ */ createModifier("TIMEOUT", Type.Number());
export type TIMEOUT = StaticModifier<typeof TIMEOUT>;

/** When performing a FT.SEARCH query, require terms in the document to have the same order as in the query. */
export const INORDER = /* #__PURE__ */ createModifier("INORDER");
export type INORDER = StaticModifier<typeof INORDER>;

/** When performing a FT.SEARCH query, use a custom query expander instead of the stemmer. */
export const EXPANDER = /* #__PURE__ */ createModifier(
  "EXPANDER",
  Type.String(),
);
export type EXPANDER = StaticModifier<typeof EXPANDER>;

/** When performing a FT.SEARCH query, use a custom scoring function. */
export const SCORER = /* #__PURE__ */ createModifier("SCORER", Type.String());
export type SCORER = StaticModifier<typeof SCORER>;

/** When performing a FT.SEARCH query, return a textual description of how the scores were calculated. */
export const EXPLAINSCORE = /* #__PURE__ */ createModifier("EXPLAINSCORE");
export type EXPLAINSCORE = StaticModifier<typeof EXPLAINSCORE>;

/** When performing a FT.SEARCH query, add an arbitrary payload to the query. */
export const PAYLOAD = /* #__PURE__ */ createModifier("PAYLOAD", Type.String());
export type PAYLOAD = StaticModifier<typeof PAYLOAD>;

/** When performing a FT.SEARCH query, sort the results by the value of an attribute. */
export const SORTBY = /* #__PURE__ */ createModifier("SORTBY", Type.String());
export type SORTBY = StaticModifier<typeof SORTBY>;

/** When performing a FT.SEARCH query, limit the number of results returned. */
export const LIMIT = /* #__PURE__ */ createModifier(
  "LIMIT",
  Type.Tuple([Type.Number(), Type.Number()]),
);
export type LIMIT = StaticModifier<typeof LIMIT>;

/** When performing a FT.SEARCH query, define value parameters to be referenced in the query. */
export const PARAMS = /* #__PURE__ */ createModifier(
  "PARAMS",
  // One or more key-value pairs
  Type.Array(Type.Any()),
);
export type PARAMS = StaticModifier<typeof PARAMS>;

/** When performing a FT.SEARCH query, select the dialect version under which to execute the query. */
export const DIALECT = /* #__PURE__ */ createModifier("DIALECT", Type.Number());
export type DIALECT = StaticModifier<typeof DIALECT>;
