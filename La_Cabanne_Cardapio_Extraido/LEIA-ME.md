# La Cabanne — importação do menu

- `la_cabanne_cardapio.csv`: folha de importação/editável.
- `la_cabanne_cardapio.json`: dados estruturados para seed.
- `la_cabanne_cardapio_revisao.md`: inventário legível para validação humana.

`preco_kz` refere-se ao preço principal visível (frequentemente garrafa nos destilados); `preco_dose_kz` é o preço por dose `S/` quando visível. Não somar ambos, são variantes alternativas.

`status_revisao=confirmar` identifica leitura ambígua. `confirmar_categoria_preco` identifica divergência de preço/categoria entre duas secções do menu. O cardápio foi fotografado de um ecrã com riscos e reflexos, e tem cortes sobretudo em cervejas e vinhos brancos. Este dataset deve ficar em staging e passar por revisão antes da publicação.

Informações extras visíveis no rodapé: horário de segunda a domingo, 08h00–23h00; existe referência a redes sociais e newsletter, mas sem URLs legíveis. Não há contactos ou endereço exacto legíveis.
