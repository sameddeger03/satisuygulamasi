import { createRouter, createWebHashHistory } from "vue-router";

import KayipIlani from '../views/404.vue';

const routes = [
  {
    path: "/",
    name: "Kontrol Ekranı",
    component: () => import("../views/kontrol.vue"),
    params: {
      gizle: true
    }
  },
  {
    path: "/odeme",
    name: "Ödeme Ekranı",
    component: () => import("../views/Odeme.vue"),
    params: {
      ikon: "bi-upc-scan",
      gizle: true
    }
  },
  {
    path: "/odemeler",
    name: "Yapılan Ödemeler",
    component: () => import("../views/Odemeler.vue"),
    params: {
      ikon: "bi-wallet",
      gizle: false
    }
  },
  {
    path: "/urunler",
    name: "Ürün Listesi",
    component: () => import("../views/Urunler.vue"),
    params: {
      ikon: "bi-list",
      gizle: false
    }
  },
  {
    path: "/kategoriler",
    name: "Kategoriler",
    component: () => import("../views/Kategoriler.vue"),
    params: {
      ikon: "bi-tags",
      gizle: false
    }
  },
  {
    path: "/gunsonu",
    name: "Gün Sonu Raporu",
    component: () => import("../views/Rapor.vue"),
    params: {
      ek: ["/raporlar"],
      gizle: true
    }
  },
  {
    path: "/raporlar",
    name: "Raporlar",
    component: () => import("../views/Raporlar.vue"),
    params: {
      ikon: "bi-clipboard2-data",
      gizle: false
    }
  },
  {
    path: "/verikontrol",
    name: "verikontrol",
    component: () => import("../views/VeriKontrol.vue"),
    params: {
      gizle: true
    }
  },
  {
    path: "/planlama",
    name: "planlama",
    component: () => import("../views/Planlama.vue"),
    params: {
      gizle: true
    }
  },
  {
    path: "/notdefteri",
    name: "notdefteri",
    component: () => import("../views/Defter.vue"),
    params: {
      gizle: true
    }
  },
  {
    path: "/copkutusu",
    name: "copkutusu",
    component: () => import("../views/Copkutusu.vue"),
    params: {
      gizle: true
    }
  },
  {
    path: "/bekle",
    name: "bekle",
    component: () => import("../views/Bekle.vue"),
    params: {
      gizle: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: KayipIlani,
    params: {
      gizle: true
    }
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
