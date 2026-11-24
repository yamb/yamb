# yamb

[![npm version][npm-image]][npm-url] [![Build status][github-actions-image]][github-actions-url] [![Coverage status][coveralls-image]][coveralls-url] [![Dependency status][libraries-image]][libraries-url]

Yamb manages editable posts and lazy collections for websites, scripts and jobs. The application supplies storage and can add content preparation and renderers.

For GitHub Packages, route the `@yamb` scope to `https://npm.pkg.github.com` and install `@yamb/core`.

## Quick start

Requires Node.js 26.13 or later. Install core and [file storage](https://github.com/yamb/storage-files).

```bash
pnpm add yamb yamb-storage-files
```

Use a trusted directory for `./posts`.

```js
import { yamb } from 'yamb';
import { files } from 'yamb-storage-files';

await using blog = yamb({
  storage: files({
    path: './posts'
  }),
  base: 'https://example.com/blog',
  timeZone: 'UTC'
});

await blog.open();

const post = await blog.create({
  title: 'Hello',
  text: 'A first draft.'
});

post.title = 'Hello, Yamb';
post.text = '**Hello**, world.';
post.tags.push('javascript');

await post.save();
await post.publish();

for await (const article of blog.published.tagged('javascript').recent(10)) {
  console.log(article.title, article.url().href);
}
```

## Packages

| Package | Role |
| --- | --- |
| [storage-files](https://github.com/yamb/storage-files) | Markdown files with JSON frontmatter in a local directory |
| [storage-mongo](https://github.com/yamb/storage-mongo) | MongoDB with prepared collections and indexes |
| [storage-sqlite](https://github.com/yamb/storage-sqlite) | Node's built-in SQLite with a prepared database |
| [markdown](https://github.com/yamb/markdown) | Source → editable tokens → HTML → sanitized page/feed projections |
| [microtypo](https://github.com/yamb/microtypo) | Native MicroTypo adapter between HTML conversion and cleanup |
| [render-html](https://github.com/yamb/render-html) | HTML view objects for individual posts |
| [render-json](https://github.com/yamb/render-json) | Post/collection JSON views and JSON Feed 1.1 |
| [render-xml](https://github.com/yamb/render-xml) | RSS 2.0 and Atom 1.0 feeds |

## Reference

- [Configuration](api/readme.md#configuration), [posts](api/readme.md#posts), [cover](api/readme.md#cover) and [collections and queries](api/readme.md#collections)
- [Storage](api/readme.md#storage) and [renderer](api/readme.md#renderers) extension APIs
- [Content preparation](api/readme.md#transformations)
- [Exports and errors](api/readme.md#exports-and-errors)
- [Architecture](docs/architecture.md)

## Author

[Alexey Simonenko](https://simonenko.xyz)

## License

MIT. See `LICENSE`.

[npm-image]: https://img.shields.io/npm/v/yamb?style=flat
[npm-url]: https://www.npmjs.com/package/yamb
[github-actions-image]: https://github.com/yamb/yamb/actions/workflows/ci.yml/badge.svg
[github-actions-url]: https://github.com/yamb/yamb/actions/workflows/ci.yml
[coveralls-image]: https://coveralls.io/repos/github/yamb/yamb/badge.svg
[coveralls-url]: https://coveralls.io/github/yamb/yamb
[libraries-image]: https://img.shields.io/librariesio/release/npm/yamb?style=flat
[libraries-url]: https://libraries.io/npm/yamb
