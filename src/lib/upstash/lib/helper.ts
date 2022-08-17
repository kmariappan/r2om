export class HelperClass {
    protected getRelatedModelName(relatedThrough: string, sourceModelName: string): string {
        let modelname = ''
        relatedThrough.split('_').forEach((d: string) => {
            if (sourceModelName !== d) {
                modelname = d
            }
        })
        return modelname
    }
}