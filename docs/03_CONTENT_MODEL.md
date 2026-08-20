# Content Model

## Sanity = Editorial Truth
### destination
Land/Stadt/Region als kuratierte Discovery-Fläche.

### place
`placeType`: course / stay / eat / do.
Nicht alle Places sind Golf.

### story
Longform, Interview, Essay, Opinion, Guide.
`related[]` macht Editorial zum Discovery-Einstieg.

### person
Menschen, die AROUND relevant findet.

### object
Gear, Design, Bücher, Produkte, Kulturgegenstände.

### collection
Redaktionell kuratierte Zusammenstellung heterogener Objekte.

## Supabase = User Truth
- profiles
- saved_items
- user_collections
- user_collection_items
- trips
- trip_items

Die beiden Systeme werden über die Sanity `_id` bzw. stabile Source IDs verbunden.
