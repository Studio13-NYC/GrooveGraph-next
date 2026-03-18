# The Janitor Gets a Badge

There is a stage in the life of a technical system when everyone still says the word "cleanup" in the tone of a civic virtue and nobody can point to the broom.

We had arrived there.

The framework had orchestration docs, routing docs, context packets, cost summaries, headcount tests, visual standards, a deployment lane, and a better sense of itself than most municipal authorities. What it did not yet have was an explicit owner for the highly unglamorous question of whether the place was actually accumulating lint in the rafters.

So we fixed that.

Today the repo gained a `hygienist` lane. This is not a poetic role. It is not visionary. It will never get invited to keynote anything. Its job is to run the cleanup workflow, interpret the output, and stop people from calling "minor hygiene" what is really just unsupervised deletion.

That mattered immediately, because the first real hygiene run produced exactly the kind of embarrassment a hygiene lane is supposed to catch. The repo was invoking `knip` as if it were a settled part of the operating system, while declining to declare it as a dependency. In other words, the cleanup process itself required cleanup.

This is the kind of thing that tends to happen in a certain phase of software ambition. A team has moved on to discussing orchestration, governance, evaluation, visual language, and cost envelopes. Meanwhile, in a quieter corner of the building, a shell command is borrowing a tool it does not officially own and hoping nobody notices.

The good news is that this was a useful kind of failure. It was small, specific, and humiliating in exactly the corrective proportion. We added `knip` to `devDependencies`, reran the hygiene pass through the new repo script, and the second run came back clean: `npm prune` succeeded, `knip` found nothing actionable, and the hygienist's official removal proposal consisted of one row with the highly adult message: remove nothing.

That is progress.

Not because nothing was removed. Because the framework now has a documented way to distinguish between:

- a clean repo
- a dirty repo
- and a repo that only looks clean because nobody bothered to instrument the inspection

We also tightened the `headcount` suite in response. The existing recorded runs were honest for the framework that existed yesterday, but they no longer covered every current lane once hygiene became first-class. So the runbook and typed test definitions were updated to include the hygienist. The next rerun will test the framework we actually have, not the one we have fondly described to ourselves.

This is, in miniature, what the new regime is supposed to feel like.

Not endless purification campaigns. Not theatrical declarations of tidiness. Just a system that is increasingly unwilling to let important work remain implied.

The janitor has a badge now. The mop closet has a key. The inspection form exists. The building is not cleaner because we said the word cleaner. It is cleaner because the procedure finally became real.
