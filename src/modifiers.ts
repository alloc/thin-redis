import { TNumber, TSchema, Type } from "@sinclair/typebox";
import { createModifier, StaticModifier } from "./modifier";

/** Only set this key if it doesn't already exist */
export const NX = createModifier("NX");
export type NX = StaticModifier<typeof NX>;

/** Only set this key if it already exists */
export const XX = createModifier("XX");
export type XX = StaticModifier<typeof XX>;

/** Set expiry only when the new expiry is greater than current one */
export const GT = createModifier("GT");
export type GT = StaticModifier<typeof GT>;

/** Set expiry only when the new expiry is less than current one */
export const LT = createModifier("LT");
export type LT = StaticModifier<typeof LT>;

/** Expiry in seconds */
export const EX = createModifier("EX", Type.Number());
export type EX = StaticModifier<typeof EX>;

/** Expiry at specified Unix time, in seconds */
export const EXAT = createModifier("EXAT", Type.Number());
export type EXAT = StaticModifier<typeof EXAT>;

/** Expiry in milliseconds */
export const PX = createModifier("PX", Type.Number());
export type PX = StaticModifier<typeof PX>;

/** Expiry at specified Unix time, in milliseconds */
export const PXAT = createModifier("PXAT", Type.Number());
export type PXAT = StaticModifier<typeof PXAT>;

/** Retain the time to live associated with the key */
export const KEEPTTL = createModifier("KEEPTTL");
export type KEEPTTL = StaticModifier<typeof KEEPTTL>;

/** Remove the time to live associated with the key */
export const PERSIST = createModifier("PERSIST");
export type PERSIST = StaticModifier<typeof PERSIST>;

//
// Full Text Search
//

/** Currently supports HASH (default) and JSON. To index JSON, you must have the RedisJSON module installed. */
export const ON = createModifier(
  "ON",
  Type.Union([Type.Literal("hash"), Type.Literal("json")]),
);
export type ON = StaticModifier<typeof ON>;

/** Tells the index which keys it should index. You can add several prefixes to index. Because the argument is optional, the default is `*` (all keys). */
export const PREFIX = createModifier("PREFIX", Type.Array(Type.String()));
export type PREFIX = StaticModifier<typeof PREFIX>;

/**
 * Filter expression with the full RediSearch aggregation expression
 * language. It is possible to use `@__key` to access the key that was just
 * added/changed.
 *
 * A field can be used to set field name by passing: FILTER
 * \@indexName=="myindexname"
 */
export const FILTER = createModifier("FILTER", Type.String());
export type FILTER = StaticModifier<typeof FILTER>;

/** If set, indicates the default language for documents in the index. Default is `English`. */
export const LANGUAGE = createModifier("LANGUAGE", Type.String());
export type LANGUAGE = StaticModifier<typeof LANGUAGE>;

/** A document attribute set as the document language. */
export const LANGUAGE_FIELD = createModifier("LANGUAGE_FIELD", Type.String());
export type LANGUAGE_FIELD = StaticModifier<typeof LANGUAGE_FIELD>;

/** Default score for documents in the index. Default score is `1.0`. */
export const SCORE = createModifier("SCORE", Type.Number());
export type SCORE = StaticModifier<typeof SCORE>;

/** Document attribute that you use as the document rank based on the user ranking. Ranking must be between `0.0` and `1.0`. If not set, the default score is `1`. */
export const SCORE_FIELD = createModifier("SCORE_FIELD", Type.String());
export type SCORE_FIELD = StaticModifier<typeof SCORE_FIELD>;

/** Document attribute that you use as a binary safe payload string to the document that can be evaluated at query time by a custom scoring function or retrieved to the client. */
export const PAYLOAD_FIELD = createModifier("PAYLOAD_FIELD", Type.String());
export type PAYLOAD_FIELD = StaticModifier<typeof PAYLOAD_FIELD>;

/** Forces RediSearch to encode indexes as if there were more than 32 text attributes, which allows you to add additional attributes (beyond 32) using FT.ALTER. For efficiency, RediSearch encodes indexes differently if they are created with less than 32 text attributes. */
export const MAXTEXTFIELDS = createModifier("MAXTEXTFIELDS");
export type MAXTEXTFIELDS = StaticModifier<typeof MAXTEXTFIELDS>;

/** Does not store term offsets for documents. It saves memory, but does not allow exact searches or highlighting. It implies NOHL. */
export const NOOFFSETS = createModifier("NOOFFSETS");
export type NOOFFSETS = StaticModifier<typeof NOOFFSETS>;

/** Conserves storage space and memory by disabling highlighting support. If set, the corresponding byte offsets for term positions are not stored. NOHL is also implied by NOOFFSETS. */
export const NOHL = createModifier("NOHL");
export type NOHL = StaticModifier<typeof NOHL>;

/** Do not store field names in the index. */
export const NOFIELDS = createModifier("NOFIELDS");
export type NOFIELDS = StaticModifier<typeof NOFIELDS>;

/** Disable storing term frequencies in the index. */
export const NOFREQS = createModifier("NOFREQS");
export type NOFREQS = StaticModifier<typeof NOFREQS>;

/** Skip the initial full scan of the dataset. */
export const SKIPINITIALSCAN = createModifier("SKIPINITIALSCAN");
export type SKIPINITIALSCAN = StaticModifier<typeof SKIPINITIALSCAN>;

/** Define custom stopwords to be ignored during indexing and query time. */
export const STOPWORDS = createModifier("STOPWORDS", Type.Array(Type.String()));
export type STOPWORDS = StaticModifier<typeof STOPWORDS>;

/** When performing a FT.SEARCH query, only return the document IDs and not the content. */
export const NOCONTENT = createModifier("NOCONTENT");
export type NOCONTENT = StaticModifier<typeof NOCONTENT>;

/** When performing a FT.SEARCH query, execute a verbatim search. */
export const VERBATIM = createModifier("VERBATIM");
export type VERBATIM = StaticModifier<typeof VERBATIM>;

/** When performing a FT.SEARCH query, ignore stopwords. */
export const NOSTOPWORDS = createModifier("NOSTOPWORDS");
export type NOSTOPWORDS = StaticModifier<typeof NOSTOPWORDS>;

/** When performing a FT.SEARCH query, return scores with the results. */
export const WITHSCORES = createModifier("WITHSCORES");
export type WITHSCORES = StaticModifier<typeof WITHSCORES>;

/** When performing a FT.SEARCH query, return payloads with the results. */
export const WITHPAYLOADS = createModifier("WITHPAYLOADS");
export type WITHPAYLOADS = StaticModifier<typeof WITHPAYLOADS>;

/** When performing a FT.SEARCH query, return sort keys with the results. */
export const WITHSORTKEYS = createModifier("WITHSORTKEYS");
export type WITHSORTKEYS = StaticModifier<typeof WITHSORTKEYS>;

/** When performing a FT.SEARCH query, filter results by numeric range. */
export const FILTER_NUMERIC = createModifier(
  "FILTER",
  Type.Array(Type.Union([Type.String(), Type.Number()])),
);
export type FILTER_NUMERIC = StaticModifier<typeof FILTER_NUMERIC>;

/** When performing a FT.SEARCH query, filter results by جغرافیایی distance. */
export const GEOFILTER = createModifier(
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
export const INKEYS = createModifier("INKEYS", Type.Array(Type.String()));
export type INKEYS = StaticModifier<typeof INKEYS>;

/** When performing a FT.SEARCH query, limit results to a set of fields. */
export const INFIELDS = createModifier("INFIELDS", Type.Array(Type.String()));
export type INFIELDS = StaticModifier<typeof INFIELDS>;

/** When performing a FT.SEARCH query, control which fields from the document are returned. */
export const RETURN = createModifier(
  "RETURN",
  Type.Array(Type.Union([Type.String(), Type.Literal("AS")])),
);
export type RETURN = StaticModifier<typeof RETURN>;

/** When performing a FT.SEARCH query, return only the sections of the attribute that contain the matched text. */
export const SUMMARIZE = createModifier("SUMMARIZE");
export type SUMMARIZE = StaticModifier<typeof SUMMARIZE>;

/** When performing a FT.SEARCH query, format occurrences of matched text. */
export const HIGHLIGHT = createModifier("HIGHLIGHT");
export type HIGHLIGHT = StaticModifier<typeof HIGHLIGHT>;

/** When performing a FT.SEARCH query, allow a maximum edit distance for matching terms in the query. */
export const SLOP = createModifier("SLOP", Type.Number());
export type SLOP = StaticModifier<typeof SLOP>;

/** When performing a FT.SEARCH query, set a timeout for processing the query. */
export const TIMEOUT = createModifier("TIMEOUT", Type.Number());
export type TIMEOUT = StaticModifier<typeof TIMEOUT>;

/** When performing a FT.SEARCH query, require terms in the document to have the same order as in the query. */
export const INORDER = createModifier("INORDER");
export type INORDER = StaticModifier<typeof INORDER>;

/** When performing a FT.SEARCH query, use a custom query expander instead of the stemmer. */
export const EXPANDER = createModifier("EXPANDER", Type.String());
export type EXPANDER = StaticModifier<typeof EXPANDER>;

/** When performing a FT.SEARCH query, use a custom scoring function. */
export const SCORER = createModifier("SCORER", Type.String());
export type SCORER = StaticModifier<typeof SCORER>;

/** When performing a FT.SEARCH query, return a textual description of how the scores were calculated. */
export const EXPLAINSCORE = createModifier("EXPLAINSCORE");
export type EXPLAINSCORE = StaticModifier<typeof EXPLAINSCORE>;

/** When performing a FT.SEARCH query, add an arbitrary payload to the query. */
export const PAYLOAD = createModifier("PAYLOAD", Type.String());
export type PAYLOAD = StaticModifier<typeof PAYLOAD>;

/** When performing a FT.SEARCH query, sort the results by the value of an attribute. */
export const SORTBY = createModifier("SORTBY", Type.String());
export type SORTBY = StaticModifier<typeof SORTBY>;

/** When performing a FT.SEARCH query, limit the number of results returned. */
export const LIMIT = createModifier(
  "LIMIT",
  Type.Tuple([Type.Number(), Type.Number()] as [
    offset: TNumber,
    count: TNumber,
  ]),
);
export type LIMIT = StaticModifier<typeof LIMIT>;

/** When performing a FT.SEARCH query, define value parameters to be referenced in the query. */
export const PARAMS = createModifier(
  "PARAMS",
  // One or more key-value pairs
  Type.Array(Type.Any()),
);
export type PARAMS = StaticModifier<typeof PARAMS>;

/** When performing a FT.SEARCH query, select the dialect version under which to execute the query. */
export const DIALECT = createModifier("DIALECT", Type.Number());
export type DIALECT = StaticModifier<typeof DIALECT>;

//
// Stream Modifiers
//

/** Do not create the stream if it does not already exist. */
export const NOMKSTREAM = createModifier("NOMKSTREAM");
export type NOMKSTREAM = StaticModifier<typeof NOMKSTREAM>;

const StreamTrimArgs = <TThreshold extends TSchema>(Threshold: TThreshold) =>
  Type.Union([
    Type.Tuple([Threshold]),
    Type.Tuple([Threshold, Type.Literal("LIMIT"), Type.Number()]),
    Type.Tuple([Type.Union([Type.Literal("~"), Type.Literal("=")]), Threshold]),
    Type.Tuple([
      Type.Union([Type.Literal("~"), Type.Literal("=")]),
      Threshold,
      Type.Literal("LIMIT"),
      Type.Number(),
    ]),
  ]);

/** Trim the stream based on the maximum number of entries. */
export const MAXLEN = createModifier("MAXLEN", StreamTrimArgs(Type.Number()));
export type MAXLEN = StaticModifier<typeof MAXLEN>;

/** Trim the stream based on the minimum entry ID. */
export const MINID = createModifier("MINID", StreamTrimArgs(Type.String()));
export type MINID = StaticModifier<typeof MINID>;

/** Maximum number of entries to return per stream. */
export const COUNT = createModifier("COUNT", Type.Number());
export type COUNT = StaticModifier<typeof COUNT>;

/** Block for the specified time in milliseconds if no data is available. */
export const BLOCK = createModifier("BLOCK", Type.Number());
export type BLOCK = StaticModifier<typeof BLOCK>;

/** Do not add messages to the Pending Entries List (PEL) in XREADGROUP. */
export const NOACK = createModifier("NOACK");
export type NOACK = StaticModifier<typeof NOACK>;

/** Create the stream if it doesn't exist (used with XGROUP CREATE). */
export const MKSTREAM = createModifier("MKSTREAM");
export type MKSTREAM = StaticModifier<typeof MKSTREAM>;

/**
 * Allows for consumer group "lag tracking".
 *
 * Takes an arbitrary ID (any ID that isn't the ID of the stream's first
 * entry, last entry, or zero `0-0` ID). Use it to find out how many
 * entries are between the arbitrary ID (excluding it) and the stream's
 * last entry.
 *
 * Added in Redis 7.0.0.
 */
export const ENTRIESREAD = createModifier("ENTRIESREAD", Type.String());
export type ENTRIESREAD = StaticModifier<typeof ENTRIESREAD>;
