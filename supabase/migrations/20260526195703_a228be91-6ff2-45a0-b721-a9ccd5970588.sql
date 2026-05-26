
-- 1. Wipe existing noisy tags
UPDATE public.library_items SET tags = '{}';

-- helper: shorthand
-- We use case-insensitive regex on title || abstract

-- 2. Re-tag based on multilingual keyword regex

UPDATE public.library_items SET tags = array_append(tags, 'agroecological-transition')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(transici[oó]n agroecol|agroecological transition|transition agro[ée]colog|transi[cç][aã]o agroecol)';

UPDATE public.library_items SET tags = array_append(tags, 'chemical-reduction')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(pesticid|agroqu[ií]mic|agrochemic|herbicid|fungicid|insecticid|glyphosat|glifosat|reducci[oó]n de qu[ií]mic|chemical reduction)';

UPDATE public.library_items SET tags = array_append(tags, 'participatory-guarantee')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(participatory guarantee|sistema[s]? participativo[s]? de garant|syst[èe]me participatif de garant|sistema[s]? participativo[s]? de garant|\ySPG\y|\yPGS\y)';

UPDATE public.library_items SET tags = array_append(tags, 'organic-farming')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(organic farming|organic agriculture|agricultura org[áa]nica|agricultura ecol[oó]gica|agriculture biologique|agricultura biol[oó]gica)';

UPDATE public.library_items SET tags = array_append(tags, 'agroforestry')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(agroforest|agroforester[íi]a|agroforesterie|agrofloresta|silvopastor|silvoarable)';

UPDATE public.library_items SET tags = array_append(tags, 'soil-health')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(soil health|soil quality|salud del suelo|calidad del suelo|sant[ée] des sols|sa[uú]de do solo|soil microb|soil organic|materia org[áa]nica del suelo)';

UPDATE public.library_items SET tags = array_append(tags, 'biodiversity')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(biodivers|agrobiodivers|biological diversity|diversidad biol[oó]gica|diversit[ée] biologique|diversidade biol[oó]gica)';

UPDATE public.library_items SET tags = array_append(tags, 'seed-sovereignty')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(seed sovereignty|seed saving|native seed|criollas|semillas nativas|semillas criollas|soberan[ií]a de las semillas|semences paysannes|sementes crioulas|landrace)';

UPDATE public.library_items SET tags = array_append(tags, 'food-sovereignty')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(food sovereignty|soberan[ií]a alimentaria|souverainet[ée] alimentaire|soberania alimentar)';

UPDATE public.library_items SET tags = array_append(tags, 'food-security')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(food security|seguridad alimentaria|s[ée]curit[ée] alimentaire|seguran[çc]a alimentar)';

UPDATE public.library_items SET tags = array_append(tags, 'climate-change')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(climate change|cambio clim[áa]tico|changement climatique|mudan[çc]a clim[áa]tica|global warming|calentamiento global|adaptation|mitigation|mitigaci[oó]n)';

UPDATE public.library_items SET tags = array_append(tags, 'carbon-sequestration')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(carbon sequest|secuestro de carbono|s[ée]questration (du |de )?carbone|sequestro de carbono|carbon stock|carbon sink)';

UPDATE public.library_items SET tags = array_append(tags, 'water-management')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(water management|gesti[oó]n del agua|gestion de l[''’]eau|gest[aã]o da [áa]gua|irrigation|riego|irriga[çc][aã]o|watershed|cuenca|drought|sequ[ií]a|s[ée]cheresse|seca)';

UPDATE public.library_items SET tags = array_append(tags, 'composting-bioinputs')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(compost|vermicompost|bioinsumo|biofertili[zs]|biopreparado|bioinput|abono org[áa]nico|adubo org[áa]nico|engrais organique|biochar|humus)';

UPDATE public.library_items SET tags = array_append(tags, 'pest-management')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(integrated pest|manejo integrado de plagas|biological control|control biol[oó]gico|lutte biologique|controle biol[oó]gico|plagas|pragas|ravageurs)';

UPDATE public.library_items SET tags = array_append(tags, 'pollinators')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(pollinat|polinizador|polinizaci[oó]n|pollinisation|poliniza[çc][aã]o|\ybee[s]?\y|abeja|abelha|abeille|apicult)';

UPDATE public.library_items SET tags = array_append(tags, 'permaculture')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(permacultur)';

UPDATE public.library_items SET tags = array_append(tags, 'regenerative-agriculture')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(regenerative agric|agricultura regenerat|agriculture r[ée]g[ée]n[ée]rat|agricultura regenerat)';

UPDATE public.library_items SET tags = array_append(tags, 'family-farming')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(family farm|agricultura familiar|agricultura campesina|peasant|campesin|paysan|smallholder|pequeno[s]? produtor|pequeño[s]? productor)';

UPDATE public.library_items SET tags = array_append(tags, 'short-supply-chains')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(short food supply|short supply chain|circuit[os]? cort[os]?|circuits courts|cadeia[s]? curta[s]?|mercado local|local food system|sistema[s]? alimentari[oa]s? local|farmers market|feira[s]? agroecol)';

UPDATE public.library_items SET tags = array_append(tags, 'public-policy')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(public polic|pol[ií]tica[s]? p[uú]blica[s]?|politique[s]? publique[s]?|pol[ií]tica[s]? p[uú]blica[s]?|governance|gobernanza|gouvernance|governan[çc]a)';

UPDATE public.library_items SET tags = array_append(tags, 'gender-equity')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(\ygender\y|g[ée]nero|genre|g[êe]nero|feminis|women|mujeres|femmes|mulheres)';

UPDATE public.library_items SET tags = array_append(tags, 'indigenous-knowledge')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(indigenous|ind[ií]gena|autochtone|tradicional knowledge|traditional knowledge|saberes ancestral|conocimiento ancestral|saberes tradicion|saber[es]? popular)';

UPDATE public.library_items SET tags = array_append(tags, 'livestock-pastoralism')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(livestock|ganader[íi]a|pecu[áa]ria|[ée]levage|pastoral|pastoreo|p[âa]turage|grazing|silvopastor)';

UPDATE public.library_items SET tags = array_append(tags, 'urban-agriculture')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(urban agric|agricultura urbana|agriculture urbaine|huerta[s]? urbana[s]?|horta[s]? urbana[s]?|community garden|huerto comunitario)';

UPDATE public.library_items SET tags = array_append(tags, 'health-nutrition')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(nutrition|nutrici[oó]n|nutri[çc][aã]o|human health|salud humana|sant[ée] humaine|sa[uú]de humana|diet|dieta|alimenta[çc][aã]o saud|healthy food)';

UPDATE public.library_items SET tags = array_append(tags, 'education-extension')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(extension|extensi[oó]n rural|extens[aã]o rural|farmer field school|escuela[s]? de campo|education|educaci[oó]n|formaci[oó]n|capacitaci[oó]n|forma[çc][aã]o)';

UPDATE public.library_items SET tags = array_append(tags, 'cooperativism')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(cooperat|cooper[áa]tiv|asociativismo|economia solid[áa]ria|econom[íi]a social|solidarity economy|[ée]conomie sociale)';

UPDATE public.library_items SET tags = array_append(tags, 'crop-diversification')
WHERE (coalesce(title,'') || ' ' || coalesce(abstract,'')) ~* '(intercrop|policultiv|polyculture|crop rotation|rotaci[oó]n de cultivos|rota[çc][aã]o de culturas|cover crop|cultivo[s]? de cobertura|diversificaci[oó]n de cultivos)';

-- 3. Items still without tags get a general label
UPDATE public.library_items
SET tags = ARRAY['agroecology']
WHERE tags IS NULL OR array_length(tags, 1) IS NULL;
