# Core architecture

Yamb coordinates mutable posts, persistence and rendering. The application selects the adapter and any preparation stages; the adapter stores source data and applies collection queries.

## Working and confirmed revisions

A Post separates its working data from the last confirmed save. A save captures the working revision before it joins that Post’s queue. When storage acknowledges the write, [save](../src/post/methods/save.js) updates the confirmed revision and reconciles only fields whose edit stamps still match the captured revision. This preserves edits made while storage was pending, including a change back to an earlier value.

Save and remove share a queue per Post instance. Independently loaded instances have independent queues, so storage must enforce URI uniqueness and reject replacement of a missing ID. If an active write fails, the queue rejects waiting operations because the stored revision may be unknown. A subsequent save or remove can run.

Storage is the only authority on the stored version. Core generates a fresh version for each write and sends the version the Post last confirmed as `expected`; the adapter compares and writes in one atomic step. A loaded Post therefore cannot overwrite or remove a revision it has not seen, and `blog.fence()` lets an application invalidate a write whose outcome it lost. Versions stay outside PostData, so hashes, rendering and preparation do not depend on them.

## Identity and lookup state

Related links store stable IDs. A slug, status or publication date can change the URI. A successful write updates both lookup directions. The blog reads `[id, uri]` pairs from `storage.entries()` on open and [sync](../src/yamb/methods/sync.js). Sync collects a complete replacement before updating the maps, so a failed walk leaves the previous core lookup state intact.

The adapter owns query execution. A PostCollection holds a query and selection until traversal; separate traversals get separate cursors. [Iterator helpers](../src/async-iterator/index.js) operate on values already selected and propagate early termination to the underlying iterator.

## Rendering and preparation

[`post.render()`](../src/post/methods/render.js) captures the post before dispatch. During [collection rendering](../src/yamb/methods/render.js), core calls `toJSON()` on each live Post as it arrives and passes plain PostData through by reference. Callers keep supplied records unchanged until rendering completes. Related lookups read current storage.

[Preparation](../src/transform.js) runs an explicit ordered stage list and freezes the derived result for reuse across outputs. The application owns preparation inputs, stage settings, cache identity and lifetime. The renderer projects the result into its output format; storage receives source data.

See the [API reference](../api/readme.md) for the adapter, collection, renderer and transformation contracts.
