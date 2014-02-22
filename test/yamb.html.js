var poor = utils.unexpected({bool: true, arr: true, num: true});

it('should works', function() {
  var a = new Yamb();
  var html = a.html(data('easymongo').preview);

  html.should.equal('<p>A <strong>small</strong> tweaks for the <a href="https://github.com/mongodb/node-mongodb-native">native MongoDB driver</a>.</p>');
});

it('should works with highlight.js', function() {
  var html;
  var a = new Yamb();

  html = a.html(data('easymongo').text);
  html.should.equal('<p>It&#39;s like native MongoDB driver but for newbie. In my opinion native driver has many difficulties. And for general purpose no need to be so flexible.</p>\n<p><strong>Benefits:</strong></p>\n<ul>\n<li>Expected return data</li>\n<li>Using strings for ObjectID values</li>\n<li><code>Collection</code> class for all manipulates with collections</li>\n<li>Additional methods for work with id like <code>findById</code>, <code>removeById</code></li>\n<li>Less callbacks</li>\n</ul>\n<p><strong>Example:</strong></p>\n<pre><code class="lang-js"><span class="hljs-keyword">var</span> users = mongo.collection(<span class="hljs-string">\'users\'</span>);\n\nusers.find(<span class="hljs-function"><span class="hljs-keyword">function</span><span class="hljs-params">(err, res)</span> {</span>\n  console.log(res);\n});\n</code></pre>');

  html = a.html(data('tumblr').text);
  html.should.equal('<h3 id="contributing">Contributing</h3>\n<p><strong>DO NOT directly modify the <code>lib</code> files.</strong> These files are automatically built from CoffeeScript sources located under the <code>src</code> directory.</p>\n<p>To do build run:</p>\n<pre><code class="lang-bash">$ cake build\n</code></pre>');

  html = a.html('```\nvar i = 0;\n```');
  html.should.equal('<pre><code>var i = 0;\n</code></pre>');
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