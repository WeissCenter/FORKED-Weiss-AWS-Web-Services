from abc import ABC


class fileTransformerFactory:
   
    def __init__(self, glue_context, spark_instance) -> None:
        self._transformers = {}
        self.glue_context = glue_context
        self.spark_instance = spark_instance

    def register(self, fileSpec, transformer, format_options):
        self._transformers[fileSpec] = {"transformer": transformer, "format_options": format_options}
    
    def get_format_options(self, fileSpec):
        transformer_config = self._transformers.get(fileSpec)

        if not transformer_config:
            raise ValueError(fileSpec)

        return transformer_config["format_options"]
    
    def get_transformer(self, fileSpec, **kwargs):
        transformer_config = self._transformers.get(fileSpec)

        if not transformer_config:
            raise ValueError(fileSpec)

        return transformer_config["transformer"](self.glue_context, self.spark_instance, **kwargs)




class fileTransformer(ABC):

    def __init__(self, glue_context, spark_instance) -> None:
        self.glue_context = glue_context
        self.spark_instance = spark_instance

    def transform(file):
        return file;