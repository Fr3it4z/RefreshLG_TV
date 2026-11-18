/*
 * Menu para webOS — escrito em ES5 de propósito, para rodar também
 * no Chromium antigo das TVs webOS 3.x/4.x.
 */
(function () {
  'use strict';

  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
    ENTER: 13, BACK: 461, RED: 403, GREEN: 404
  };
  var ORDER_KEY = 'lgdetox.order';
  var APP_MGR = 'luna://com.webos.applicationManager';

  var cfg = window.MENU_CONFIG || { FALLBACK_APPS: [], HIDDEN_IDS: [] };
  var gridEl = document.getElementById('grid');
  var scrollerEl = document.getElementById('scroller');
  var statusEl = document.getElementById('status');

  var apps = [];        // [{ key, id, title, icon, color, params }]
  var tiles = [];       // elementos .tile, mesma ordem de `apps`
  var focus = 0;
  var usingFallback = false;
  var baseStatus = '';  // mensagem fixa (ex.: aviso de lista fixa)

  /* ================= Luna (serviços do sistema) ================= */

  var liveBridges = []; // manter referência, senão o GC mata o callback

  function luna(uri, params, onOk, onFail, subscribe) {
    onOk = onOk || function () {};
    onFail = onFail || function () {};
    params = params || {};
    if (subscribe) params.subscribe = true;

    // 1) Biblioteca oficial webOSTV.js, se você a incluir no projeto
    if (window.webOS && webOS.service && webOS.service.request) {
      var i = uri.lastIndexOf('/');
      webOS.service.request(uri.substring(0, i), {
        method: uri.substring(i + 1),
        parameters: params,
        subscribe: !!subscribe,
        onSuccess: onOk,
        onFailure: onFail
      });
      return;
    }

    // 2) Ponte nativa disponível em todo app web do webOS
    if (typeof window.PalmServiceBridge !== 'undefined') {
      var bridge = new window.PalmServiceBridge();
      liveBridges.push(bridge);
      bridge.onservicecallback = function (msg) {
        var res;
        try { res = JSON.parse(msg); } catch (e) { res = { returnValue: false, errorText: String(e) }; }
        if (res.returnValue === false) onFail(res); else onOk(res);
        if (!subscribe) {
          var idx = liveBridges.indexOf(bridge);
          if (idx >= 0) liveBridges.splice(idx, 1);
        }
      };
      bridge.call(uri, JSON.stringify(params));
      return;
    }

    // 3) Fora da TV (navegador do PC)
    onFail({ returnValue: false, errorText: 'Fora da TV: serviços Luna indisponíveis' });
  }

  /* ================= Carregar apps ================= */

  function toFileUrl(path) {
    if (!path) return '';
    if (path.charAt(0) === '/') return 'file://' + path;
    return path;
  }

  function fromLaunchPoint(lp) {
    return {
      key: lp.launchPointId || lp.id,
      id: lp.id,
      title: lp.title || lp.id,
      icon: toFileUrl(lp.largeIcon || lp.icon || lp.mediumIcon),
      color: lp.bgColor || '',
      params: lp.params || null,
      cfgIndex: 0
    };
  }

  function fromFallback(a, i) {
    return { key: a.id, id: a.id, title: a.title, icon: a.icon || '', color: a.color || '', params: a.params || null, cfgIndex: i };
  }

  var subscribed = false;
  var refetchTimer = null;

  function loadApps() {
    luna(APP_MGR + '/listLaunchPoints', {}, function (res) {
      if (res.launchPoints) {
        usingFallback = false;
        baseStatus = '';
        setStatus('');
        setApps(res.launchPoints.map(fromLaunchPoint));
      } else if (res.change) {
        // App instalado/removido/atualizado: recarrega a lista inteira.
        clearTimeout(refetchTimer);
        refetchTimer = setTimeout(function () {
          luna(APP_MGR + '/listLaunchPoints', {}, function (r) {
            if (r.launchPoints) setApps(r.launchPoints.map(fromLaunchPoint));
          });
        }, 500);
      }
    }, function (err) {
      usingFallback = true;
      // Normal em várias TVs: apps de desenvolvedor não podem listar os apps.
      console.log('Usando lista fixa (apps.config.js):', err.errorText);
      var list = cfg.FALLBACK_APPS.map(fromFallback);
      setApps(list);
      hideNotInstalled(list);
    }, !subscribed);
    subscribed = true;
  }

  // Lista fixa: pergunta à TV (API documentada) se cada app existe e
  // remove os que não estão instalados. Se a pergunta falhar, mantém o app.
  function hideNotInstalled(list) {
    var pending = list.length, missing = {};
    list.forEach(function (a) {
      luna(APP_MGR + '/getAppLoadStatus', { appId: a.id }, function (res) {
        if (res.exist === false) missing[a.id] = true;
        done();
      }, done);
    });
    function done() {
      if (--pending > 0) return;
      var kept = list.filter(function (a) { return !missing[a.id]; });
      if (kept.length !== list.length) setApps(kept);
    }
  }

  function setApps(list) {
    var hidden = cfg.HIDDEN_IDS || [];
    list = list.filter(function (a) { return hidden.indexOf(a.id) < 0; });

    // Aplica a ordem salva (apps novos vão para o fim, em ordem alfabética)
    var saved = readOrder();
    var pos = {};
    saved.forEach(function (k, i) { pos[k] = i; });
    list.sort(function (a, b) {
      var pa = pos.hasOwnProperty(a.key) ? pos[a.key] : 1e6;
      var pb = pos.hasOwnProperty(b.key) ? pos[b.key] : 1e6;
      if (pa !== pb) return pa - pb;
      if (a.cfgIndex !== b.cfgIndex) return a.cfgIndex - b.cfgIndex; // lista fixa: ordem do config
      return a.title.localeCompare(b.title);
    });

    var focusedKey = apps[focus] && apps[focus].key;
    apps = list;
    render();
    var keep = indexOfKey(focusedKey);
    setFocus(keep >= 0 ? keep : 0);
  }

  function indexOfKey(key) {
    for (var i = 0; i < apps.length; i++) if (apps[i].key === key) return i;
    return -1;
  }

  /* ================= Ordem (localStorage) ================= */

  function readOrder() {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY)) || []; } catch (e) { return []; }
  }
  function saveOrder() {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(apps.map(function (a) { return a.key; }))); } catch (e) {}
  }

  function moveFocusedToStart() {
    if (focus <= 0 || !apps.length) return;
    var a = apps.splice(focus, 1)[0];
    apps.unshift(a);
    saveOrder();
    render();
    setFocus(0);
  }

  /* ================= Renderização ================= */

  var PALETTE = ['#2f6fed', '#8e4ec6', '#d6409f', '#e5484d', '#f76b15', '#30a46c', '#12a594', '#0090ff'];

  function colorFor(a) {
    if (a.color) return a.color;
    var h = 0;
    for (var i = 0; i < a.id.length; i++) h = (h * 31 + a.id.charCodeAt(i)) | 0;
    return PALETTE[Math.abs(h) % PALETTE.length];
  }

  function render() {
    gridEl.innerHTML = '';
    tiles = [];
    if (!apps.length) {
      var e = document.createElement('div');
      e.className = 'empty';
      e.textContent = 'Nenhum app encontrado.';
      gridEl.appendChild(e);
      return;
    }
    apps.forEach(function (a, i) {
      var t = document.createElement('div');
      t.className = 'tile';
      t.style.backgroundColor = colorFor(a);

      var art = document.createElement('div');
      art.className = 'art';
      if (a.icon) {
        var img = document.createElement('img');
        img.onerror = function () { art.innerHTML = ''; art.appendChild(letter(a)); };
        img.src = a.icon;
        art.appendChild(img);
      } else {
        art.appendChild(letter(a));
      }

      var label = document.createElement('div');
      label.className = 'label';
      label.textContent = a.title;

      t.appendChild(art);
      t.appendChild(label);

      // Magic Remote (ponteiro)
      t.addEventListener('mouseover', function () { setFocus(i); });
      t.addEventListener('click', function () { setFocus(i); launch(apps[i]); });

      gridEl.appendChild(t);
      tiles.push(t);
    });
  }

  function letter(a) {
    var s = document.createElement('div');
    s.className = 'letter';
    s.textContent = (a.title || '?').charAt(0).toUpperCase();
    return s;
  }

  /* ================= Foco e navegação ================= */

  function setFocus(i) {
    if (!tiles.length) return;
    i = Math.max(0, Math.min(tiles.length - 1, i));
    if (tiles[focus]) tiles[focus].className = 'tile';
    focus = i;
    tiles[focus].className = 'tile focused';
    ensureVisible(tiles[focus]);
  }

  function columns() {
    if (tiles.length < 2) return 1;
    var top = tiles[0].offsetTop;
    for (var i = 1; i < tiles.length; i++) if (tiles[i].offsetTop !== top) return i;
    return tiles.length;
  }

  function ensureVisible(el) {
    var margin = 40;
    var top = el.offsetTop - gridEl.offsetTop;
    var bottom = top + el.offsetHeight;
    var viewTop = scrollerEl.scrollTop;
    var viewH = scrollerEl.clientHeight - 60;
    if (top - margin < viewTop) scrollerEl.scrollTop = Math.max(0, top - margin);
    else if (bottom + margin > viewTop + viewH) scrollerEl.scrollTop = bottom + margin - viewH;
  }

  function move(dx, dy) {
    var cols = columns();
    var n = tiles.length;
    if (!n) return;
    var next = focus;
    if (dx) {
      next = focus + dx;
      // não "quebra" de linha ao andar para os lados
      if (next < 0 || next >= n || Math.floor(next / cols) !== Math.floor(focus / cols)) return;
    } else if (dy > 0) {
      next = focus + cols;
      if (next >= n) {
        // última linha incompleta: vai para o último item, se houver linha abaixo
        if (Math.floor((n - 1) / cols) > Math.floor(focus / cols)) next = n - 1; else return;
      }
    } else if (dy < 0) {
      next = focus - cols;
      if (next < 0) return;
    }
    setFocus(next);
  }

  document.addEventListener('keydown', function (ev) {
    switch (ev.keyCode) {
      case KEY.LEFT:  move(-1, 0); break;
      case KEY.RIGHT: move(1, 0); break;
      case KEY.UP:    move(0, -1); break;
      case KEY.DOWN:  move(0, 1); break;
      case KEY.ENTER: if (apps[focus]) launch(apps[focus]); break;
      case KEY.RED:   moveFocusedToStart(); break;
      case KEY.GREEN: loadApps(); break;
      case KEY.BACK:  break; // é o menu: "voltar" não faz nada
      default: return;
    }
    ev.preventDefault();
  });

  /* ================= Abrir app ================= */

  function launch(a) {
    var p = { id: a.id };
    if (a.params) p.params = a.params;
    setStatus('Abrindo ' + a.title + '…');
    luna(APP_MGR + '/launch', p, function () {
      setStatus(baseStatus);
    }, function (err) {
      setStatus('Não foi possível abrir ' + a.title + ': ' + (err.errorText || 'erro'));
      if (!window.PalmServiceBridge) console.log('[simulação] launch', p);
    });
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  /* ================= Relógio ================= */

  var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
               'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var timeEl = document.getElementById('time');
  var dateEl = document.getElementById('date');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tick() {
    var d = new Date();
    timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    var dia = DIAS[d.getDay()];
    dateEl.textContent = dia.charAt(0).toUpperCase() + dia.slice(1) + ', ' +
      d.getDate() + ' de ' + MESES[d.getMonth()];
    setTimeout(tick, 1000 - d.getMilliseconds() + 5);
  }

  /* ================= Início ================= */

  // Ao voltar para o menu (ex.: depois de fechar um app), garante a lista atualizada.
  document.addEventListener('webOSRelaunch', function () { loadApps(); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && usingFallback) loadApps();
  });

  tick();
  loadApps();
})();
