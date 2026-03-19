# The Research Loop Leaves the Lab

There is a difference between saying a future product will be discovery-first and watching a real session produce sources, evidence, claims, and graph-shaped candidates while you are still deciding what the ontology ought to become.

That difference is where the new GrooveGraph research workspace now lives.

Until this week, the idea was clear enough on paper. We wanted a text-first investigation surface inside the dev environment. We wanted it built around the OpenAI `Responses API` and `Conversations API`, with built-in `web_search`, application tools, durable session state, and a review loop that lets a human keep or reject provisional structure before any schema becomes law. We wanted the graph to begin as an evidence-shaped memory, not as a premature taxonomy.

Now that loop is real.

The new workspace under `research/tools/openai-research-workspace/` can start a session, persist the OpenAI conversation, collect cited sources, record evidence snippets, extract claims, propose entities and relationships, and let the operator accept, defer, or reject the resulting graph candidates. The first end-to-end artist-seed run used `Prince` as the seed and pulled official discography material into a local research session that stayed inspectable the whole way through.

That matters for a more interesting reason than mere feature completion.

The point of this workspace is not to cosplay as a polished product before we know what the product is. It is to give GrooveGraph a place where search, collection, persistence, and revision can happen in public view while the product definition is still being earned. If a discovery-first GrooveGraph is going to deserve the name, it has to prove that the act of gathering and shaping evidence can happen before ontology hardening. The workspace is the first place where that proposition can now be tested instead of admired.

The most reassuring part of the work was not that the happy path worked. It was that the unhappy paths turned out to be the right kind of honest.

Real OpenAI runtime validation immediately exposed two schema mistakes in the local implementation. One involved structured outputs using `optional()` in places where the API expects required-or-nullable fields. The other came from using `z.record()` for flexible attributes, which generated a function schema the API correctly rejected. Both errors were fixed by making the tool contracts more explicit and more portable: nullable fields where required, and attribute key/value pairs instead of a free-form record in the tool boundary. The local session model can remain flexible while the API-facing schema stays strict enough to be valid.

That is exactly the kind of correction this repo should be generating right now.

Not grand ontology debates. Not decorative product language. Concrete evidence about where a discovery workflow bends, where it breaks, and what shape of structure survives contact with real sessions.

So the research loop has left the lab in the most useful sense. It still lives in `research/`, because it is still an experiment. But it is no longer hypothetical. The repo now contains a working surface where an investigation can start with a question, travel through web-backed evidence gathering, and come back as a set of reviewable graph candidates with traceable provenance.

That is a better beginning for the next GrooveGraph than pretending we already know the final schema.
