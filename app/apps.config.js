/*
 * Configuração do menu. Edite à vontade e reinstale o app.
 *
 * FALLBACK_APPS: usada quando a TV não deixa o app listar os apps instalados
 * (ou quando você abre o index.html no navegador do PC para testar).
 * Para adicionar um app, você precisa do ID dele (ex.: 'netflix'). Se colocar um
 * ID errado ou de um app não instalado, ele só não aparece; não quebra nada.
 * (ares-install --list só mostra apps de desenvolvedor, não os da loja.)
 *
 * A grade segue a ordem desta lista (até você reordenar com o botão vermelho).
 * Apps que não estão instalados são escondidos automaticamente.
 * Ícone próprio: coloque a imagem em app/ e use  icon: 'icons/arquivo.png' (PNG ou SVG)
 *
 * HIDDEN_IDS: apps que nunca aparecem na grade.
 */
var MENU_CONFIG = {
  FALLBACK_APPS: [
    { id: 'netflix',                    title: 'Netflix',      color: '#b20710', icon: 'icons/netflix.svg' },
    { id: 'youtube.leanback.v4',        title: 'YouTube',      color: '#cc0000', icon: 'icons/youtube.svg' },
    { id: 'amazon',                     title: 'Prime Video',  color: '#1a98ff', icon: 'icons/primevideo.svg' },
    { id: 'com.disney.disneyplus-prod', title: 'Disney+',      color: '#113ccf', icon: 'icons/disneyplus.svg' },
    { id: 'com.wbd.stream',             title: 'HBO Max',      color: '#2b1a7a', icon: 'icons/hbomax.svg' },
    { id: 'spotify-beehive',            title: 'Spotify',      color: '#1db954', icon: 'icons/spotify.svg' },
    { id: 'com.webos.app.livetv',       title: 'TV ao vivo',   color: '#3a4256', icon: 'icons/livetv.svg' },
    { id: 'com.webos.app.hdmi1',        title: 'HDMI 1',       color: '#3a4256', icon: 'icons/hdmi.svg' },
    { id: 'com.webos.app.hdmi2',        title: 'HDMI 2',       color: '#3a4256', icon: 'icons/hdmi.svg' },
    { id: 'com.webos.app.browser',      title: 'Navegador',    color: '#3a4256', icon: 'icons/browser.svg' },
    { id: 'com.palm.app.settings',      title: 'Configurações',color: '#3a4256', icon: 'icons/settings.svg' }
  ],

  HIDDEN_IDS: [
    'com.lgdetox.menu'   // o próprio menu
  ]
};
