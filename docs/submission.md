# Analysis of data structures and algorithms in the context of cycle detection in directed acyclic graphs

**Nicolas Heiligenthal**  
nicolas.heiligenthal@code.berlin  
Semester 9  
SE_02 Algorithms and Data Structures  
Repository: [github.com/crumpi/algosandds](https://github.com/crumpi/algosandds)

## Abstract

Testing the implementation of a DAG in an adjacency matrix as well as different implementations of adjacency lists shows that adjacency lists are much more efficient compared to adjacency matrixes in terms of the required memory storage. Comparing the different algorithms shows a clear difference between DFS with and without tracking visited nodes. The difference between BFS and DFS was found to be neglectable. 

## Table of Content

1. Outline
2. Execution
   1. Test Graphs
   2. Data Structures
   3. Algorithms
      1. DFS cost on matrix vs adjacency lists
      2. Memory usage of different algorithms



&nbsp;

## 1. Outline

To deepen my understanding of the implication of using different data structures and algorithms I want to analyze different approaches to cycle detection in knowledge graphs (dependency graphs). Knowledge graphs that cover prerequisites are directed sparse graphs. When adding an edge from topic A to topic B, topic B becomes a prerequisite of topic A. We need to ensure that there will never be a cycle so that it is guaranteed that prerequisites will always start at a definite point. Thus, whenever a new edge is added from topic A to topic B, we need to run an algorithm to determine if topic B already points to topic A. This makes it a basic search problem.

For representing the topics I compare adjacency matrixes with adjacency lists. For adjacency lists I will test 4 different implementations which I will mention further down.

For the search algorithm to do the cycle detection I test 3 different implementations: breath first search (BFS), depth first search with visited nodes (DFS) and depth first search without visited nodes (DFSnoV).

The problem of cycle detection is relevant for every DAG that we add edges to, as every added edge might create cycle. For me this is the case for the described cycle detection for prerequisites in a knowledge graph. 

### Things to analyze

- size of in-memory representation of knowledge graph depending on different data structures
- memory and compute cost of running cycle detection algorithms using different implementations
- maybe a comparison to running cycle detection through sql



&nbsp;

&nbsp;

## 2. Execution

## 2.1 Test Graphs

To test impact on different graph sizes, I generated a script that builds DAGs of various sizes:

// table of the properties of the different kg\_ graphs according to the overview.csv file in 1_generation/graphs

This should help me get a  good understanding of how memory and runtime of data structures and algorithms changes in relation to the graph size. 



## 2.2 Data Structures

I've tested the implementation of 5 different data structures, one adjacency matrix and 4 different implementations of adjacency 

// lists:  table of the 4 adjacency lists with outter and inner thing 



In accordance of the theory I found that the required memory space grows quadratically using an adjacency matrix, but linearly using adjacency lists:  

// 2_data structures memory_loglog_p5png 

This demonstrates well how the differences between different implementations of adjacency lists become neglectable when considering growing input sizes compared to an adjacency matrix. However, when only considering the memory sizes of the different implementations of adjacency lists, there is a noticeable difference to be seen:

// data structures memory_list_p5.png  

A 33% increase of memory when considering an order of magnitude of tens of megabytes of memory would not necessarily be relevant in my scenario as I would probably just need to hold one knowledge graph in memory. I could imagine that there are other problems where you have to do hold various different graphs in memory, or where the graphs are massively larger. Then it might actually become a noticeable factor to use an array of arrays as an adjacency list instead of a map of sets. 



## 2.3 Algorithms

For the cycle detection I compare 3 different algorithms as mentioned: breath first search (BFS), depth first search with visited nodes (DFS) and depth first search without visited nodes (DFSnoV). 

Every algorithm (3) was run on every graph size implemented (10 for each adjacency lists, 8 for matrix) in every data structure (5). There have been 10 checks with a cycle and 10 checks without a cycle been run on every topic level (12), each 5 times and the median was noted. For the representation the averages of these checks have been noted and used for building the plots. 



#### 2.3.1 DFS cost on matrix vs adjacency lists

Using DFS, the time spent per node visited scales linearly on matrixes, while it is constant for all adjacency lists. 

// time_per_visit_p5.png

This is the first counterintuitive finding. I assumed that the matrixes should perform better here compared to the adjacency lists. However, this was based on the misconception that complexity comparison we are doing is about the check of edge A -&gt; B. However, the relevant factor here is reading all neighbors of A, which is a constant for the sparse graph with 5 neighbors per node, compared to the total number of nodes V for the matrix.



#### 2.3.2 Memory usage of different algorithms

To evaluate the memory usage of the different algorithms I compare their maximum held number of entries in the visited set + the queue of the not yet visited nodes as the actual memory size is too small to measure at that scale.

// memory_algorithms_p5.png

We can clearly see how DFSnoV has a constant number of items hold at any points, making it O(1), while that number grows steadily for the BFS and DFS. In theory this has O(n) for BFS and DFS, but as we only visit a subset of our graph, it actually only grows much slower than linearly. BFS holding a set of the visited nodes as well as an array of the nodes to visit makes it grow due to bigger graphs. DFS holding a set of the visited nodes as well has a similar effect, but we can see that the number of the nodes held is a bit smaller compared to BFS, as the array of nodes to visit is not being stored here. DFSnoV has a constant size as the call stack has a limited maximum depth with our DAG example.   

Even though the number of nodes held in BFS and DFS does not slow down noticeably when growing the graph size, I assume this must be related to how the DAG is being generated and that with that setup, the number of nodes reachable grows consistently. In an actual knowledge graph I assume that factor to slow down as more and more domains should not link to each other when continuing to populate the graph.



&nbsp;