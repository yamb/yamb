var poor = utils.unexpected({bool: true, arr: true, num: true});

var text = {
  simple: 'Hey **everyone**! Look at http://simonenko.su and let *me* know if you ~~hate~~like it.',
  code: 'See this javascript code:\n\n```js\nif ("text".trim().length > 0) console.log("ok");\n```'
};

it('should works', function() {
  var a = new Yamb();
  var html = a.html(text.simple);

  html.should.equal('<p>Hey <strong>everyone</strong>! Look at <a href="http://simonenko.su">http://simonenko.su</a> and let <em>me</em> know if you <del>hate</del>like it.</p>');
});

it('should works with highlight.js', function() {
  var a = new Yamb();
  var html = a.html(text.code);

  html.should.equal('<p>See this javascript code:</p>\n<pre><code class="lang-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">"text"</span>.trim().length &gt; <span class="hljs-number">0</span>) console.log(<span class="hljs-string">"ok"</span>);\n</code></pre>');
});

it('should not work with unexpected values', function() {
  var html;
  var a = new Yamb();

  for (var i=0, length=poor.length; i<length; i++) {
    if (typeof poor[i] == 'string') {
      continue;
    }

    html = a.html(poor[i]);
    html.should.be.false;
  }
});