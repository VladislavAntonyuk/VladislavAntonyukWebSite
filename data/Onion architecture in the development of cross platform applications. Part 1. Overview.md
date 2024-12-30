Hello!

It's been a while since my previous article. For this time the website survived some downtimes and my updates :)

I am creating a cross-platform application [Draw & GO](https://drawgo.azurewebsites.net){target="_blank"} and would like to share some steps and approaches which I used to create it.

One of the most important parts of each application is **architecture**. Creating a new application is like planning a baby. A good genetic and strong skeleton are keys to success. But do not forget that the code should always be useful, not just cool in terms of architecture, etc.

Modern applications have both website and mobile/desktop applications to synchronize users' data between different platforms.

Our task is to extract the common code - models and interfaces, which can be used in both web and mobile applications. It's called **Domain** and **Application** respectively.

The code, which is specific for the platform, we'll move to the **Infrastructure** and **UI**. These are the 4 base levels of the Onion architecture.

Onion architecture is the division of an application into layers. Moreover, there is one independent level, which is in the center of the architecture. The second level depends on this level, the third depends on the second, and so on. That is, it turns out that around the first independent level, the second dependent is layered. Around the second, the third is layered, which can also depend on the first. Figuratively, this can be expressed in the form of an onion, which also has a core, around which all other layers are layered, up to the husk.

The number of levels may differ, but the center is always the Domain Model, that is, those model classes that are used in the application and whose objects are stored in the database.

![Onion Architecture](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/9/onion-architecture1.png)

**Advantages of Onion Architecture**
1. The drawback of 3-tier and n-tier architectures is unnecessary coupling. Onion Architecture solved this problem by defining layers from the core to the Infrastructure. It applies the fundamental rule by moving all coupling towards the center. This architecture is undoubtedly biased toward object-oriented programming, and it puts objects before all others.
2. Any specific implementation will be provided to the application at runtime.
3. Onion architecture provides better testability because a unit test can be created for individual layers without being influenced by other modules in the application.

**Pragmatic Clean Architecture**

This comprehensive course will teach you the system I use to ship production-ready applications using Clean Architecture. Learn how to apply the best practices of modern software architecture. It contains Everything You Need To Build Production-Ready Applications With Clean Architecture.

[![Pragmatic Clean Architecture](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/misc/pca_cover_1.png)](https://www.courses.milanjovanovic.tech/a/aff_q2snzxhl/external?affcode=1486372_ffmooc4t)

In the next article, we'll create Domain and Application levels: [Onion architecture in the development of cross-platform applications. Part 2. Domain and Application](./articles/Onion-architecture-in-the-development-of-cross-platform-applications.-Part-2.-Domain-and-Application){target="_blank"}