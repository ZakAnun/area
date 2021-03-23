---
title: 刷算法的基本认知
description: algorithm base concept
image: https://picsum.photos/536/354?random&date=2021-03-18
date: 2021-03-18
vssue-title: algorithm base concept
tags:
  - knowledge
categories:
  - algorithm
---

### 一些基本概念
#### 算法
- 深度优先搜索算法（DFS, Depth-First-Search），用于遍历或搜索树或图的算法，会从一个节点出发探寻到该路径上最后一个节点，然后回溯到该节点选择另外一条路径出发，直到整个树或图的节点被访问。
- 广度优先搜索算法（BFS，Breath-First-Search），从根节点开始，沿着树的宽度遍历树的节点，直到所有节点都被访问。
#### 树

- 满二叉树: 除叶子节点外的所有节点都有两个子节点
<br/><img src="/img/full_bin_tree.png" width="240" height="240"/>
- 完全二叉树: 每个节点的孩子节点的数量可以是 0、1、2 个，而且每层节点的添加必须是从左到右
<br/><img src="/img/wq_bin_tree.png" width="240" height="240"/>
- 二叉搜索树（二叉排序树）: 左子树小于该节点，右子树大于该节点，反过来也一样
<br/><img src="/img/order_bin_tree.png" width="240" height="240"/>
- 平衡二叉树（AVL 树）: 左右子树的高度差的绝对值不超过1，且左右子树也都是平衡二叉树，一般在二叉搜索树上添加自动维持平衡的性质
<br/><img src="/img/balance_bin_tree.png" width="240" height="240"/>