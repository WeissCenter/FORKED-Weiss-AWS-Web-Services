from data.transformers.edfactsCSVTransformer import edFactsCSVTransformer

class fs007Transformer(edFactsCSVTransformer):
    def __init__(self, glue_context, spark_instance, **kwargs):
        super().__init__(glue_context, spark_instance, **kwargs)

    def transform(self, pysparkDF):
        df = super().transform(pysparkDF)
        if "ideainterimremoval" in df.columns:
            # Rename the column to match the expected output
            df = df.withColumnRenamed("ideainterimremoval", "ideainterimremovalreason")
        return df