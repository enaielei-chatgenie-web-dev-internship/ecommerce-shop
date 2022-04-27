<script setup>
import {ref, reactive, onMounted, computed} from "vue";
import { RouterLink, RouterView } from "vue-router";
import HelloWorld from "@/components/HelloWorld.vue";

import * as ec from "@/assets/scripts/ecommerce.js";

const user = reactive(new ec.User("Amolat", "Nommel Isanar", "Lavapie").create());

ec.Product.get().length = 0;
for(let product of [
  "Apples", "Mango", "Guava", "Orange", "Strawberry", "Grape"
]) {
  new ec.Product(product, "", Math.random() * 25.25).create();
}

const products = computed(() => {
  return ec.Product.get({limit: 5, skip: 0});
});

const purchases = computed(() => {
  return user.purchases();
});

const cartPrice = computed(() => {
  let ps = purchases.value.map((p) => {
    return p.price;
  });
  return parseFloat(ps.reduce((x, y) => x + y, 0).toFixed(2));
})

function addToCart(ev) {
  let pe = $(ev.target).closest(".product");
  let id = parseInt(pe.data("product"));
  let quant = parseInt(pe.find("input").val()) || 1;
  let pro = ec.Product.getFirst({
    properties: {id}
  });
  let pur = ec.Purchase.getFirst({properties: {
    user, product: pro
  }});
  if(pur && pur.existing) {
    pur.quantity += quant;
  } else {
    pur = new ec.Purchase(user, pro, quant);
    pur.create();
  }
}

function removeToCart(ev) {
  let pu = $(ev.target).closest(".purchase");
  let id = parseInt(pu.data("purchase"));
  let pur = ec.Purchase.getFirst({properties: {id}});
  if(pur) pur.delete();
}
</script>

<template>
  <div>
    <h1>Products</h1>
    <i>Count: {{ec.Product.get().length}}</i>
    <div v-for="product in products" :style="{color: 'red !important;'}" class="product" :id="`product-${product.id}`" :key="product.id" :data-product="product.id">
      {{product.name}} - &#8369;{{product.price}} x <input type="number" min="1" value="1"> <button type="button" @click="addToCart">Add to Cart</button>
    </div>
  </div>

  <br>

  <div>
    <h1>Cart</h1>
    <i>Count: {{purchases.length}}</i>, <i>Price: &#8369;{{cartPrice}}</i>
    <div v-for="purchase in purchases" :style="{color: 'red !important;'}" class="purchase" :id="`purchase-${purchase.id}`" :key="purchase.id" :data-purchase="purchase.id">
      {{purchase.product.name}} - &#8369;{{purchase.product.price}} x <input type="number" min="1" v-model="purchase.quantity"> = &#8369;{{purchase.price}} <button @click="removeToCart">Remove from Cart</button>
    </div>
  </div>
  <!-- <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView /> -->
</template>

<style>
@import "@/assets/base.css";

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;

  font-weight: normal;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

a,
.green {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1);
  transition: 0.4s;
}

@media (hover: hover) {
  a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  body {
    display: flex;
    place-items: center;
  }

  #app {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0 2rem;
  }

  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
