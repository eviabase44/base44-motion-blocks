# Clicked asset → related bundle

The homepage now lasts 3.5 seconds and the bundle 1.5 seconds. The complete sequence remains 19 seconds. Two scroll pushes lead to a cursor click; the complete item moves to the center over six study frames. Its final geometry, source region and outline are identical to the first bundle frame. Existing cut, timing and layer controls remain available.

## Host contract

Supply `showcase.bundle` with an explicit relationship to the selected product/item:

```js
bundle: {
  assetId: 'product-123',
  label: 'Selected product',
  anchor: {x: 455, y: 430, width: 370, height: 340},
  media: {
    src: '/captures/page.png', width: 1280, height: 1800,
    region: {x: 455, y: 430, width: 370, height: 340},
    cornerRadius: 20
  },
  related: [
    {id: 'photo', assetId: 'product-123', role: 'mood', label: 'Product photo',
      media: {src: '/assets/product-photo.png', width: 1080, height: 1350}},
    {id: 'component', featureId: 'asset-library', role: 'feature', label: 'Asset library card',
      media: {src: '/captures/library.png', width: 1440, height: 900,
        region: {x: 100, y: 300, width: 240, height: 320}, cornerRadius: 20}}
  ]
}
```

`anchor` uses homepage source pixels. `media` represents that same whole item, with its original aspect ratio and measured corner radius in source pixels. Transparent isolated images are supported. The slot contains the entire item rather than applying a square crop. Supply a clean component region or transparent cutout when its shape is more complex than a rounded rectangle.

Supply up to eight `related` visual candidates in editorial priority order. Each must carry the matching `assetId` or a `featureId` referencing an available feature in this app. Set `role` to `feature` for recognizable UI fragments or `mood` for contextual app imagery. Associations and relevance are supplied by the product adapter, not inferred from neighboring images. Older sources lacking `bundle` use the observed homepage hover item, or the first selected feature, with no unrelated filler.

The bundle shows at most four distinct visuals so each can stay readable. It omits duplicate source regions, regions with a side below 120 source pixels, and extreme aspect ratios outside 0.4–3. These are geometry safeguards, not semantic image recognition; the adapter must still select meaningful content. Supply complete cards/components or properly framed images, not logo slivers or faces cut from posters. Legacy `detail` entries remain importable but no longer become floating fact tiles. All four resting positions sit inside the canvas, clear of the central asset, and contain each visual at its own aspect ratio. The archived smooth experiment remains separate.

The scroll cannot exceed supplied capture pixels. Nonzero scroll settings are constrained so the complete target remains visible for the click. A zero-scroll setting stays zero; if the target is offscreen, no false click or isolation is shown. For a valid handoff, the target must fit the homepage viewport and its source region. Layer edits remain independent per shot, so moving the center card manually in one shot can intentionally break the authored match-cut.

## Motion details

- Related cards retain SH22 onset, relative scale and translation samples, retargeted to four larger, separated positions. Scaling uses the panel center, with a 20px canvas inset constraining the entry overshoot so components stay whole. This is a bounded adaptation of the paths. They reach their destinations by frame 11 of the 18-frame bundle. The shorter hold moves into the features sooner. Existing layer IDs and movement controls are retained.
- The three feature backgrounds enter on offset keys and continue a restrained lateral drift behind the held UI. **Background type travel** controls the amount, including zero.
- The ending uses three held glyph configurations adapted from B44-06 native frames 1200–1206, retargeted to the seven Figma symbol slots. The default five output frames map to states `0,0,1,2,2`, then the fixed credit. **Symbol flicker duration** changes the interval. This is a declared adaptation, not a frame-exact recreation of the entire source ending.
- All controls participate in Save/Load/Download/Import tweaks. The app font, palette, copy, fixed Base44 lockup and direct element editing remain intact.

## Local PUSHBOX review

A populated PUSHBOX campaign item provides the click target. The four surrounding panels use one complete linked campaign creative, a whole asset-library card, an assigned schedule card, and community imagery already present in the app library. No tiny portrait cutouts, detached logo strip, repeated poster frames or loose duration/location tiles remain. Two overlapping authorized local screenshots provide 1,425 pixels of page content and 575 pixels of scroll travel, compared with 94 pixels previously. The cursor, click, scrolling and isolation are authored animation, not a recording.

Private source captures, linked creative, soundtrack and example data remain ignored local files. The public fixture demonstrates the same contract with wireframes. The renderer requires host-supplied associations; automatic relationship extraction from arbitrary URLs is not implemented by this revision.
