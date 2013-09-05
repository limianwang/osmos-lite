# The Memory Driver

Osmos comes with a built-in memory driver that can be used as a simple data store for testing purposes. It features no optimizations whatsoever—don't use it in production!

The driver can be instantiated from `Osmos.drivers.Memory`, and requires the use of a primary key.