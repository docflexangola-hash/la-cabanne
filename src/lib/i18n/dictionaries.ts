export type Locale = 'pt' | 'en';

export const dictionaries: Record<Locale, Record<string, string>> = {
  pt: {
    // Navegação e estrutura
    menu: 'Menu',
    menu_h1: 'Menu do La Cabanne',
    nav_categories: 'Categorias do menu',
    nav_groups: 'Grupos do menu',
    close: 'Fechar',

    // Produtos
    unavailable: 'Esgotado',
    price_from: 'desde',
    price_on_request: 'Preço sob consulta',
    on_request: 'Sob consulta',
    view_details: 'Ver detalhes de',
    close_product: 'Fechar detalhe do produto',
    serves: 'Serve',
    sold_out_now: 'Esgotado neste momento.',
    price_label: 'Preço',
    allergens: 'Alergénios:',
    price_tax_note:
      'Preço com IVA incluído. Consulte a equipa para informação sobre alergénios.',

    // Estado vazio
    still_no_products: 'Ainda sem produtos nesta categoria',
    new_soon: 'Novos produtos serão publicados em breve.',

    // Feedback
    feedback_title_small: 'Ajude-nos a melhorar !',
    feedback_title: 'Fale sobre o nosso atendimento',
    feedback_subtitle: 'O seu feedback é privado e ajuda-nos a melhorar continuamente.',
    leave_review: 'Deixar avaliação',
    fb_type: 'Tipo',
    fb_compliment: 'Elogio',
    fb_suggestion: 'Sugestão',
    fb_complaint: 'Reclamação',
    fb_other: 'Outro',
    fb_rating: 'Classificação (1-5)',
    fb_comment: 'Comentário (obrigatório, 10-2000 caracteres)',
    fb_name: 'Nome (opcional)',
    fb_contact: 'Contacto (opcional)',
    fb_privacy_prefix: 'Ao enviar, concorda com a',
    fb_privacy_link: 'Política de Privacidade',
    fb_error: 'Ocorreu um erro. Tente novamente.',
    fb_sending: 'A enviar...',
    fb_submit: 'Enviar feedback',
    fb_thanks: 'Obrigado pelo feedback',
    fb_thanks_body: 'A sua mensagem foi recebida com sucesso.',

    // Hero
    ver_menu: 'Ver cardápio',
    bem_vindo_ao: 'Bem-vindo ao',

    // Informações
    info_aria: 'Informações do restaurante',
    info_title: 'Informações do',
    info_details: 'Informação',
    menu_digital: 'Menu digital',
    horario: 'Horário',
    aberto: 'Aberto',
    fechado: 'Fechado',
    open_state: 'Aberto',
    closed_state: 'Fechado',
    hours_tbc: 'Horário por confirmar.',
    info_soon: 'Informação detalhada disponível em breve.',
    close_info: 'Fechar informações',

    // Rodapé e controlos
    footer_rights: 'La Cabanne · Restaurante & Lounge',
    footer_location: 'Benguela, Angola',
    theme_light: 'Dia',
    theme_dark: 'Noite',
    theme_auto: 'Auto',
    lang_pt: 'PT',
    lang_en: 'EN',
  },
  en: {
    // Navigation and structure
    menu: 'Menu',
    menu_h1: 'La Cabanne Menu',
    nav_categories: 'Menu categories',
    nav_groups: 'Menu groups',
    close: 'Close',

    // Products
    unavailable: 'Sold out',
    price_from: 'from',
    price_on_request: 'Price on request',
    on_request: 'On request',
    view_details: 'View details for',
    close_product: 'Close product details',
    serves: 'Serves',
    sold_out_now: 'Sold out at the moment.',
    price_label: 'Price',
    allergens: 'Allergens:',
    price_tax_note:
      'Price includes VAT. Ask our team for allergen information.',

    // Empty state
    still_no_products: 'No dishes in this category yet',
    new_soon: 'New dishes coming soon.',

    // Feedback
    feedback_title_small: 'Help us improve!',
    feedback_title: 'Share your experience',
    feedback_subtitle: 'Your feedback is private and helps us get better.',
    leave_review: 'Leave a review',
    fb_type: 'Type',
    fb_compliment: 'Compliment',
    fb_suggestion: 'Suggestion',
    fb_complaint: 'Complaint',
    fb_other: 'Other',
    fb_rating: 'Rating (1-5)',
    fb_comment: 'Comment (required, 10-2000 characters)',
    fb_name: 'Name (optional)',
    fb_contact: 'Contact (optional)',
    fb_privacy_prefix: 'By submitting, you agree to our',
    fb_privacy_link: 'Privacy Policy',
    fb_error: 'Something went wrong. Please try again.',
    fb_sending: 'Sending...',
    fb_submit: 'Send feedback',
    fb_thanks: 'Thank you for your feedback',
    fb_thanks_body: 'Your message was received successfully.',

    // Hero
    ver_menu: 'See the menu',
    bem_vindo_ao: 'Welcome to',

    // Information
    info_aria: 'Restaurant info',
    info_title: 'Information for',
    info_details: 'Information',
    menu_digital: 'Digital menu',
    horario: 'Hours',
    aberto: 'Open',
    fechado: 'Closed',
    open_state: 'Open',
    closed_state: 'Closed',
    hours_tbc: 'Hours to be confirmed.',
    info_soon: 'Detailed information available soon.',
    close_info: 'Close information',

    // Footer and controls
    footer_rights: 'La Cabanne · Restaurant & Lounge',
    footer_location: 'Benguela, Angola',
    theme_light: 'Day',
    theme_dark: 'Night',
    theme_auto: 'Auto',
    lang_pt: 'PT',
    lang_en: 'EN',
  },
};
